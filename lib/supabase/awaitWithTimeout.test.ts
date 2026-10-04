import { describe, expect, it } from "vitest";
import { awaitWithTimeout } from "./awaitWithTimeout";

describe("awaitWithTimeout", () => {
  it("resolves when the operation finishes before the timeout", async () => {
    await expect(awaitWithTimeout(Promise.resolve("ok"), 100)).resolves.toBe("ok");
  });

  it("rejects when the operation never settles", async () => {
    await expect(awaitWithTimeout(new Promise(() => {}), 20)).rejects.toThrow(
      /timed out/i
    );
  });
});
