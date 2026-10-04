function abortError() {
  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  return error;
}

// Reject when the timeout fires even if `fetchImpl` ignores `AbortSignal`.
// Vercel Edge DNS/TCP hangs often never call the signal handler.

export function createTimedFetch(
  timeoutMs: number,
  fetchImpl: typeof fetch = fetch
): typeof fetch {
  const timedFetch: typeof fetch = async (input, init) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const onOuterAbort = () => controller.abort();

    if (init?.signal) {
      if (init.signal.aborted) {
        controller.abort();
      } else {
        init.signal.addEventListener("abort", onOuterAbort, { once: true });
      }
    }

    try {
      return await new Promise<Response>((resolve, reject) => {
        const onAbort = () => reject(controller.signal.reason ?? abortError());
        if (controller.signal.aborted) {
          onAbort();
          return;
        }

        controller.signal.addEventListener("abort", onAbort, { once: true });
        Promise.resolve(fetchImpl(input, { ...init, signal: controller.signal })).then(
          (response) => {
            controller.signal.removeEventListener("abort", onAbort);
            resolve(response);
          },
          (error: unknown) => {
            controller.signal.removeEventListener("abort", onAbort);
            reject(error);
          }
        );
      });
    } finally {
      clearTimeout(timeoutId);
      init?.signal?.removeEventListener("abort", onOuterAbort);
    }
  };

  return timedFetch;
}
