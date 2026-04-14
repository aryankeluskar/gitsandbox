import { describe, it, expect } from "vitest";
import { estimateCost, formatCost } from "../src/lib/estimateCost";

describe("estimateCost", () => {
  it("calculates cost for claude-sonnet-4", () => {
    const cost = estimateCost({
      provider: "anthropic",
      model: "claude-sonnet-4",
      inputTokens: 1000,
      outputTokens: 500,
    });
    // (1000/1M * 3.0) + (500/1M * 15.0) = 0.003 + 0.0075 = 0.0105
    expect(cost).toBeCloseTo(0.0105, 6);
  });

  it("calculates cost for gpt-4o-mini", () => {
    const cost = estimateCost({
      provider: "openai",
      model: "gpt-4o-mini",
      inputTokens: 10000,
      outputTokens: 5000,
    });
    // (10000/1M * 0.15) + (5000/1M * 0.6) = 0.0015 + 0.003 = 0.0045
    expect(cost).toBeCloseTo(0.0045, 6);
  });

  it("uses default pricing for unknown model", () => {
    const cost = estimateCost({
      provider: "unknown",
      model: "unknown-model",
      inputTokens: 1000000,
      outputTokens: 0,
    });
    // 1M/1M * 3.0 = 3.0
    expect(cost).toBe(3.0);
  });

  it("returns 0 for zero tokens", () => {
    const cost = estimateCost({
      provider: "anthropic",
      model: "claude-sonnet-4",
      inputTokens: 0,
      outputTokens: 0,
    });
    expect(cost).toBe(0);
  });
});

describe("formatCost", () => {
  it("formats small costs as cents", () => {
    expect(formatCost(0.005)).not.toContain("$");
  });

  it("formats larger costs with dollar sign", () => {
    expect(formatCost(1.5)).toBe("$1.5000");
  });
});
