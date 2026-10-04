import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

const originalFetch = globalThis.fetch;
const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalSupabaseAnonKey;
});

test("returns a response when Supabase auth does not respond", async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

  const session = {
    access_token: "test-access-token",
    refresh_token: "test-refresh-token",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: "bearer",
    user: {
      id: "test-user",
      aud: "authenticated",
      role: "authenticated",
      email: "test@example.com",
    },
  };
  const cookieValue = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;

  globalThis.fetch = (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
    });

  const request = new NextRequest("https://example.com/", {
    headers: {
      cookie: `sb-test-auth-token=${cookieValue}`,
    },
  });

  const outcome = await Promise.race([
    middleware(request).then(() => "response"),
    new Promise<string>((resolve) => setTimeout(() => resolve("deadline"), 3000)),
  ]);

  assert.equal(outcome, "response");
});
