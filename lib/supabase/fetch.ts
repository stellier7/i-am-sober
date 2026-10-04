export const SUPABASE_FETCH_TIMEOUT_MS = 4_000;

/**
 * A `fetch` for Supabase clients that never hangs.
 *
 * Supabase's auth client treats every thrown fetch error (timeouts, DNS
 * failures, aborted requests) as retryable and retries with backoff for up to
 * 30s. Vercel kills Edge Middleware at 25s and serverless functions sooner, so
 * a slow or unreachable Supabase project otherwise takes the whole site down
 * with a 504. Returning a non-5xx response is the only way to make auth-js
 * stop immediately, so failures surface as a synthetic 408 instead of throwing.
 */
export function createTimeoutFetch(timeoutMs = SUPABASE_FETCH_TIMEOUT_MS): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } catch (error) {
      const reason =
        error instanceof Error && error.name === "AbortError"
          ? `Supabase request timed out after ${timeoutMs}ms`
          : `Supabase request failed: ${error instanceof Error ? error.message : String(error)}`;
      return new Response(JSON.stringify({ message: reason, msg: reason }), {
        status: 408,
        headers: { "Content-Type": "application/json" },
      });
    } finally {
      clearTimeout(timer);
    }
  };
}
