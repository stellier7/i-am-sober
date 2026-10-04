import { describe, expect, it } from "vitest";
import { createTimedFetch } from "./timedFetch";

describe("createTimedFetch", () => {
  it("aborts a hanging fetch so the caller is not blocked", async () => {
    const hangingFetch: typeof fetch = () => new Promise(() => {});
    const timedFetch = createTimedFetch(20, hangingFetch);

    await expect(timedFetch("https://example.supabase.co/auth/v1/user")).rejects.toMatchObject({
      name: "AbortError",
    });
  });

  it("returns the underlying response when fetch succeeds", async () => {
    const response = new Response("ok", { status: 200 });
    const timedFetch = createTimedFetch(100, async () => response);

    await expect(timedFetch("https://example.supabase.co/auth/v1/user")).resolves.toBe(response);
  });
});
