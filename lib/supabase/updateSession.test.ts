import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { updateSession } from "./updateSession";

const ORIGINAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ORIGINAL_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

afterEach(() => {
  if (ORIGINAL_URL === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_URL;

  if (ORIGINAL_KEY === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ORIGINAL_KEY;
});

function sessionCookie(projectRef: string, accessToken = "test-access-token") {
  const session = JSON.stringify({
    access_token: accessToken,
    refresh_token: "test-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
  });
  return `sb-${projectRef}-auth-token=base64-${Buffer.from(session).toString("base64url")}`;
}

describe("updateSession", () => {
  it("does not wait on supabase when env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const hangingFetch: typeof fetch = () => new Promise(() => {});
    const request = new NextRequest("http://localhost:3000/");

    const started = Date.now();
    const response = await updateSession(request, { fetch: hangingFetch, timeoutMs: 5_000 });
    expect(response.status).toBe(200);
    expect(Date.now() - started).toBeLessThan(200);
  });

  it("does not call supabase when there is no auth cookie", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    let fetchCalls = 0;
    const hangingFetch: typeof fetch = () => {
      fetchCalls += 1;
      return new Promise(() => {});
    };
    const request = new NextRequest("http://localhost:3000/");

    const started = Date.now();
    const response = await updateSession(request, { fetch: hangingFetch, timeoutMs: 5_000 });
    expect(response.status).toBe(200);
    expect(fetchCalls).toBe(0);
    expect(Date.now() - started).toBeLessThan(200);
  });

  it("does not treat a PKCE verifier cookie as a session", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    let fetchCalls = 0;
    const hangingFetch: typeof fetch = () => {
      fetchCalls += 1;
      return new Promise(() => {});
    };
    const request = new NextRequest("http://localhost:3000/", {
      headers: { cookie: "sb-proj-auth-token-code-verifier=abc" },
    });

    const response = await updateSession(request, { fetch: hangingFetch, timeoutMs: 5_000 });
    expect(response.status).toBe(200);
    expect(fetchCalls).toBe(0);
  });

  it("still returns a response when supabase auth never responds", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    let fetchCalls = 0;
    const hangingFetch: typeof fetch = () => {
      fetchCalls += 1;
      return new Promise(() => {});
    };
    const request = new NextRequest("http://localhost:3000/", {
      headers: { cookie: sessionCookie("proj") },
    });

    const started = Date.now();
    const response = await updateSession(request, { fetch: hangingFetch, timeoutMs: 80 });
    const elapsed = Date.now() - started;

    expect(response.status).toBe(200);
    expect(fetchCalls).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(1_000);
  });

  it("refreshes the session when supabase auth responds", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const urls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      urls.push(String(input));
      if (String(input).includes("/user")) {
        return new Response(
          JSON.stringify({
            id: "11111111-1111-1111-1111-111111111111",
            aud: "authenticated",
            role: "authenticated",
            email: "you@email.com",
            app_metadata: {},
            user_metadata: {},
            created_at: new Date().toISOString(),
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
      return new Response("not found", { status: 404 });
    };

    const request = new NextRequest("http://localhost:3000/", {
      headers: { cookie: sessionCookie("proj") },
    });
    const response = await updateSession(request, { fetch: fetchImpl, timeoutMs: 1_000 });

    expect(response.status).toBe(200);
    expect(urls.some((url) => url.includes("/auth/v1/user"))).toBe(true);
  });
});
