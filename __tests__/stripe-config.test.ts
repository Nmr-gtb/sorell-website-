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

  // --- Non-régression : les price IDs Pro actifs sont les nouveaux (9,99€),
  // pas les anciens archivés. Ce test aurait attrapé le checkout dashboard cassé.
  it("Pro price IDs are the current active ones, not the archived 19€ ones", () => {
    expect(PRICE_IDS.pro_monthly).toBe("price_1Tlm577A2mOEJEeWRGeMx6YD");
    expect(PRICE_IDS.pro_annual).toBe("price_1Tlm5T7A2mOEJEeWw4ggdmWU");
    expect(PRICE_IDS.pro_monthly).not.toMatch(/TE3pa/);
    expect(PRICE_IDS.pro_annual).not.toMatch(/TE3ps/);
  });

  // Les anciens IDs Pro archivés restent mappés vers "pro" (garde-fou anti-downgrade)
  it("legacy Pro price IDs still map to 'pro' (no silent downgrade)", () => {
    expect(PRICE_TO_PLAN["price_1TE3pa7A2mOEJEeWltqInvgW"]).toBe("pro");
    expect(PRICE_TO_PLAN["price_1TE3ps7A2mOEJEeW4m1wm00z"]).toBe("pro");
  });

  // Source de vérité unique : dashboard, tarifs et le serveur importent tous
  // lib/price-ids, donc la désynchronisation client/serveur est impossible.
  it("client and server share the same price-ids source of truth", async () => {
    const shared = await import("@/lib/price-ids");
    expect(shared.PRICE_IDS).toEqual(PRICE_IDS);
  });
});
