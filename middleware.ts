import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createTimeoutFetch } from "@/lib/supabase/fetch";

// Vercel kills Edge Middleware at 25s and the whole site 504s. Each Supabase
// request is already bounded by createTimeoutFetch; this caps the whole refresh
// as a backstop. On failure we simply skip the refresh: pages do their own auth
// check and redirect to /login.
const AUTH_REFRESH_DEADLINE_MS = 8_000;

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
}

function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Supabase session refresh exceeded ${ms}ms`)),
      ms
    );
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // No session cookie means there is nothing to refresh, so skip the network
  // round-trip entirely (signed-out visitors, /login, magic-link landing).
  if (!supabaseUrl || !supabaseAnonKey || !hasSupabaseAuthCookie(request)) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: createTimeoutFetch() },
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

  try {
    // Invalid/expired sessions come back as `{ error }` and are normal; only
    // the deadline or unexpected throws reach the catch.
    await withDeadline(supabase.auth.getUser(), AUTH_REFRESH_DEADLINE_MS);
  } catch (error) {
    console.error("[middleware] Supabase session refresh failed; continuing without it", error);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)",
  ],
};
