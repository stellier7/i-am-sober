import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { withTimeout } from "@/lib/withTimeout";

// Vercel aborts middleware that runs too long (504 MIDDLEWARE_INVOCATION_TIMEOUT),
// which takes down every page at once. Give up on refreshing the session well
// before that and serve the request as signed-out instead.
const AUTH_REFRESH_TIMEOUT_MS = 2500;

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  // Without a session cookie there is nothing to refresh, so skip the round trip.
  if (!hasSupabaseAuthCookie(request)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const controller = new AbortController();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, signal: controller.signal }),
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const refreshed = await withTimeout(
    supabase.auth.getUser().then(() => true),
    AUTH_REFRESH_TIMEOUT_MS,
    false
  );

  if (!refreshed) {
    controller.abort();
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next internals, the auth callback (it manages its own session), and
    // anything that looks like a static file.
    "/((?!_next/|auth/callback|.*\\.[^/]+$).*)",
  ],
};
