import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

const SUPABASE_URL = "https://ggxnfycvzadchlmghkaz.supabase.co";
const ANON_KEY = "test-anon-key";
const COOKIE_NAME = "sb-ggxnfycvzadchlmghkaz-auth-token";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

function sessionCookie(): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: "user-1",
      role: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    })
  ).toString("base64url");
  const session = {
    access_token: `${header}.${payload}.sig`,
    refresh_token: "refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: "user-1", aud: "authenticated", role: "authenticated" },
  };
  return `${COOKIE_NAME}=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
}

function requestWithSession(path = "/"): NextRequest {
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON_KEY;
  return new NextRequest(`https://iamsober.vercel.app${path}`, {
    headers: { cookie: sessionCookie() },
  });
}

test("signed-in requests do not hang when the auth host never responds", { timeout: 6_000 }, async () => {
  globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        resolve(new Response("still waiting", { status: 504 }));
      }, 30_000);
      const signal = init?.signal;
      const onAbort = () => {
        clearTimeout(timer);
        reject(signal?.reason ?? new DOMException("The operation was aborted", "AbortError"));
      };
      if (signal?.aborted) {
        onAbort();
        return;
      }
      signal?.addEventListener("abort", onAbort, { once: true });
    })) as typeof fetch;

  const started = Date.now();
  const response = await middleware(requestWithSession());
  const elapsed = Date.now() - started;

  assert.ok(elapsed < 5000, `middleware waited ${elapsed}ms`);
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "https://iamsober.vercel.app/login?error=unreachable");
  const cleared = response.headers.getSetCookie().some((cookie) => cookie.startsWith(`${COOKIE_NAME}=`) && cookie.includes("Max-Age=0"));
  assert.ok(cleared, `expected session cookie to be cleared, got ${response.headers.getSetCookie().join(" | ")}`);
});

test("a dead auth host signs the session out instead of hanging", async () => {
  globalThis.fetch = (async () => {
    throw new TypeError("fetch failed");
  }) as typeof fetch;

  const started = Date.now();
  const response = await middleware(requestWithSession());

  assert.ok(Date.now() - started < 1_000);
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "https://iamsober.vercel.app/login?error=unreachable");
});

test("a valid session is not treated as an outage", async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({ id: "user-1", aud: "authenticated", role: "authenticated" }),
      { status: 200, headers: { "content-type": "application/json" } }
    )) as typeof fetch;

  const response = await middleware(requestWithSession("/"));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("location"), null);
});

test("an invalid session is not reported as an outage", async () => {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ message: "invalid claim", error: "invalid_token" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;

  const response = await middleware(requestWithSession());

  assert.notEqual(
    response.headers.get("location"),
    "https://iamsober.vercel.app/login?error=unreachable"
  );
});

test("signed-out requests do not call the auth host", async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    throw new TypeError("fetch failed");
  }) as typeof fetch;
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON_KEY;

  const response = await middleware(new NextRequest("https://iamsober.vercel.app/"));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("location"), null);
  assert.equal(calls, 0);
});
