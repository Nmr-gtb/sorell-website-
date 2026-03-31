import { describe, it, expect, vi } from "vitest";

// Must mock Stripe before importing, since stripe.ts creates instance at module level
vi.mock("stripe", () => ({
  default: class {
    constructor() {
      // no-op
    }
    checkout = { sessions: { create: vi.fn() } };
  },
}));

import { PRICE_IDS, PRICE_TO_PLAN } from "@/lib/stripe";

describe("Stripe configuration", () => {
  it("has exactly 4 price IDs", () => {
    expect(Object.keys(PRICE_IDS)).toHaveLength(4);
  });

  it("all price IDs start with price_", () => {
    Object.values(PRICE_IDS).forEach((priceId) => {
      expect(priceId).toMatch(/^price_/);
    });
  });

  it("PRICE_TO_PLAN maps every price ID to a plan", () => {
    Object.values(PRICE_IDS).forEach((priceId) => {
      expect(PRICE_TO_PLAN[priceId]).toBeDefined();
    });
  });

  it("PRICE_TO_PLAN only maps to valid plans", () => {
    const validPlans = ["pro", "business"];
    Object.values(PRICE_TO_PLAN).forEach((plan) => {
      expect(validPlans).toContain(plan);
    });
  });

  it("pro plans map to 'pro'", () => {
    expect(PRICE_TO_PLAN[PRICE_IDS.pro_monthly]).toBe("pro");
    expect(PRICE_TO_PLAN[PRICE_IDS.pro_annual]).toBe("pro");
  });

  it("business plans map to 'business'", () => {
    expect(PRICE_TO_PLAN[PRICE_IDS.business_monthly]).toBe("business");
    expect(PRICE_TO_PLAN[PRICE_IDS.business_annual]).toBe("business");
  });
});
