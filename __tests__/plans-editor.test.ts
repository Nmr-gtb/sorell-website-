import { describe, it, expect } from "vitest";
import { canUseEditor, getModelForPlan, getArticlesForPlan, canCustomizeLength, resolveArticleCount } from "@/lib/plans";

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

describe("longueur de newsletter personnalisable", () => {
  it("allows business and enterprise plans only", () => {
    expect(canCustomizeLength("business")).toBe(true);
    expect(canCustomizeLength("enterprise")).toBe(true);
    expect(canCustomizeLength("free")).toBe(false);
    expect(canCustomizeLength("pro")).toBe(false);
  });

  it("uses the configured count for eligible plans", () => {
    expect(resolveArticleCount("business", 12)).toBe(12);
    expect(resolveArticleCount("enterprise", 3)).toBe(3);
    expect(resolveArticleCount("business", 6)).toBe(6);
  });

  it("falls back to the plan default when no valid count is configured", () => {
    expect(resolveArticleCount("business", null)).toBe(8);
    expect(resolveArticleCount("business", undefined)).toBe(8);
    expect(resolveArticleCount("enterprise", null)).toBe(10);
  });

  it("rejects out-of-bounds or invalid values", () => {
    expect(resolveArticleCount("business", 2)).toBe(8);
    expect(resolveArticleCount("business", 13)).toBe(8);
    expect(resolveArticleCount("business", 7.5)).toBe(8);
    expect(resolveArticleCount("enterprise", NaN)).toBe(10);
  });

  it("ignores the configured count for non-eligible plans (server-side gating)", () => {
    expect(resolveArticleCount("free", 12)).toBe(5);
    expect(resolveArticleCount("pro", 12)).toBe(5);
  });
});
