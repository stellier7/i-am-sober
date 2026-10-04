import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { fetchWithTimeout } from "@/lib/supabase/fetchWithTimeout";

const SUPABASE_COOKIE_PREFIX = "sb-";

function isUnreachableAuthError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AuthRetryableFetchError"
  );
}

function clearSupabaseCookies(request: NextRequest, response: NextResponse) {
  for (const cookie of request.cookies.getAll()) {
    if (!cookie.name.startsWith(SUPABASE_COOKIE_PREFIX)) continue;
    response.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
  }
}

function unreachableResponse(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", "unreachable");
  const alreadyThere =
    request.nextUrl.pathname === "/login" &&
    request.nextUrl.searchParams.get("error") === "unreachable";
  const response = alreadyThere
    ? NextResponse.next({ request: { headers: request.headers } })
    : NextResponse.redirect(loginUrl);
  clearSupabaseCookies(request, response);
  return response;
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: fetchWithTimeout },
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
    const { error } = await supabase.auth.getUser();
    if (isUnreachableAuthError(error)) return unreachableResponse(request);
  } catch (error) {
    if (
      isUnreachableAuthError(error) ||
      (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError"))
    ) {
      return unreachableResponse(request);
    }
    throw error;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)",
  ],
};
