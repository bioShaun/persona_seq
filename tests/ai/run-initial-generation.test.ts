import { describe, expect, it } from "vitest";
import { errorMessage, sanitizeGenerationError } from "@/lib/ai/generation-errors";

describe("initial generation runner", () => {
  it("keeps sanitized provider errors without leaking large payloads", () => {
    const error = new Error(`AI 请求失败 (401): not authorized ${"x".repeat(500)}`);

    const sanitized = sanitizeGenerationError(error);

    expect(sanitized).toMatch(/^AI 请求失败 \(401\): not authorized/);
    expect(sanitized.length).toBeLessThanOrEqual(300);
  });

  it("uses a generic message for unexpected errors", () => {
    expect(sanitizeGenerationError(new Error("raw stack details"))).toBe(
      "AI 生成失败，请稍后重试。",
    );
  });

  it("formats unknown errors with a fallback", () => {
    expect(errorMessage(123, "oops")).toBe("oops");
    expect(errorMessage(new Error("x"), "oops")).toBe("x");
  });
});
