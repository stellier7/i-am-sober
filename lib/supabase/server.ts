import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "./env";
import { withTimeout } from "../withTimeout";

// Serverless functions are killed at the platform timeout; fail Supabase calls
// first so pages fall back to the login screen instead of hanging.
const REQUEST_TIMEOUT_MS = 5000;
const AUTH_TIMEOUT_MS = 4000;

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }),
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components can't write cookies; middleware refreshes sessions.
          }
        },
      },
    }
  );
}

/** Returns the signed-in user, or null if Supabase is unreachable in time. */
export function getUser(supabase: ReturnType<typeof createClient>) {
  return withTimeout(
    supabase.auth.getUser().then(({ data }) => data.user),
    AUTH_TIMEOUT_MS,
    null
  );
}
