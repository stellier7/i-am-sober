import { describe, expect, it } from "vitest";
import { describeAuthError } from "./authError";

describe("describeAuthError", () => {
  it("explains network failures so a missing supabase project is actionable", () => {
    expect(describeAuthError(new TypeError("Failed to fetch"))).toMatch(/Can't reach Supabase/i);
  });

  it("passes through supabase auth error messages", () => {
    expect(describeAuthError({ message: "Email rate limit exceeded" })).toBe(
      "Email rate limit exceeded"
    );
  });
});
