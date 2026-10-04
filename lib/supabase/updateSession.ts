import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { awaitWithTimeout } from "./awaitWithTimeout";
import { createTimedFetch } from "./timedFetch";

export const AUTH_FETCH_TIMEOUT_MS = 4_000;

type UpdateSessionOptions = {
  fetch?: typeof fetch;
  timeoutMs?: number;
};

function hasAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((cookie) => /^sb-.+-auth-token(?:\.\d+)?$/.test(cookie.name));
}

export async function updateSession(
  request: NextRequest,
  options: UpdateSessionOptions = {}
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const timeoutMs = options.timeoutMs ?? AUTH_FETCH_TIMEOUT_MS;

  if (!supabaseUrl || !supabaseAnonKey || !hasAuthCookie(request)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: createTimedFetch(timeoutMs, options.fetch ?? fetch),
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

  try {
    // Aborting a slow refresh can theoretically rotate a refresh token without
    // persisting it. Healthy Auth responds well under this budget; a hung host
    // must not 504 the whole request.
    await awaitWithTimeout(supabase.auth.getUser(), timeoutMs);
  } catch {
    // Unreachable or hung Auth must not 504 the page.
  }

  return response;
}
