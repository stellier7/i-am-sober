/**
 * Resolves with `fallback` when `promise` has not settled within `ms`, or rejects.
 *
 * Supabase retries failed auth requests internally for up to 30s, which outlasts
 * the time Vercel allows middleware and server functions to run, so every call
 * made while rendering a request needs its own deadline.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    const settle = (value: T) => {
      clearTimeout(timer);
      resolve(value);
    };
    promise.then(settle, () => settle(fallback));
  });
}
