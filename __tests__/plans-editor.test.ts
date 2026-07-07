import { describe, it, expect } from "vitest";
import { canUseEditor, getModelForPlan, getArticlesForPlan } from "@/lib/plans";

// ---------------------------------------------------------------------------
// Gating du mode éditeur : réservé aux plans Business et Enterprise.
// ---------------------------------------------------------------------------

describe("canUseEditor", () => {
  it("allows business and enterprise plans", () => {
    expect(canUseEditor("business")).toBe(true);
    expect(canUseEditor("enterprise")).toBe(true);
  });

  it("denies free, pro and legacy solo plans", () => {
    expect(canUseEditor("free")).toBe(false);
    expect(canUseEditor("pro")).toBe(false);
    expect(canUseEditor("solo")).toBe(false);
  });

  it("denies unknown or empty plans", () => {
    expect(canUseEditor("")).toBe(false);
    expect(canUseEditor("premium")).toBe(false);
  });
});

describe("plan helpers used by the editor endpoints", () => {
  it("maps business/enterprise to the top model", () => {
    expect(getModelForPlan("business")).toBe("claude-opus-4-8");
    expect(getModelForPlan("enterprise")).toBe("claude-opus-4-8");
  });

  it("keeps article counts aligned with plans", () => {
    expect(getArticlesForPlan("business")).toBe(8);
    expect(getArticlesForPlan("enterprise")).toBe(10);
  });
});
