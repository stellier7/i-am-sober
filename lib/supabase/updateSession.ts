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
  return request.cookies.getAll().some((cookie) => cookie.name.includes("-auth-token"));
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
    await awaitWithTimeout(supabase.auth.getUser(), timeoutMs);
  } catch {
    // A hung or unreachable Auth server must not 504 the whole request.
  }

  return response;
}
