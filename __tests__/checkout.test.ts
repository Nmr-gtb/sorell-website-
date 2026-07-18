import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetAuthenticatedUser = vi.fn();
vi.mock("@/lib/auth", () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/mock" }),
      },
    },
    coupons: {
      retrieve: vi.fn().mockRejectedValue(new Error("not found")),
      create: vi.fn().mockResolvedValue({ id: "coupon_test" }),
    },
  },
  PRICE_IDS: {
    pro_monthly: "price_pro_monthly",
    pro_annual: "price_pro_annual",
    business_monthly: "price_business_monthly",
    business_annual: "price_business_annual",
  },
}));

vi.mock("@/lib/ratelimit", () => ({
  checkoutRateLimit: {
    limit: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock supabaseAdmin conscient de la table : profiles + referrals renvoient
// chacun une donnée pilotable (null par défaut = pas d'abonnement actif, pas de
// parrainage → chemin nominal). Piloté par mockState pour tester le parrainage.
const { mockState } = vi.hoisted(() => ({
  mockState: { profile: null as Record<string, unknown> | null, referral: null as Record<string, unknown> | null },
}));
vi.mock("@/lib/supabase-admin", () => {
  const makeChain = (table: string) => {
    const chain: Record<string, unknown> = {};
    chain.select = () => chain;
    chain.eq = () => chain;
    chain.maybeSingle = () =>
      Promise.resolve({
        data: table === "referrals" ? mockState.referral : table === "profiles" ? mockState.profile : null,
        error: null,
      });
    return chain;
  };
  return { supabaseAdmin: { from: (table: string) => makeChain(table) } };
});

import { POST } from "@/app/api/checkout/route";
import { stripe } from "@/lib/stripe";
import { checkoutRateLimit } from "@/lib/ratelimit";

const mockCreate = stripe.checkout.sessions.create as ReturnType<typeof vi.fn>;
const mockRateLimit = checkoutRateLimit.limit as ReturnType<typeof vi.fn>;
const mockCoupons = stripe.coupons as unknown as {
  retrieve: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
};

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ url: "https://checkout.stripe.com/session-123" });
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockRateLimit.mockResolvedValue({ success: true });
    mockState.profile = null;
    mockState.referral = null;
    mockCoupons.retrieve.mockRejectedValue(new Error("not found"));
    mockCoupons.create.mockResolvedValue({ id: "coupon_test" });
    process.env.NEXT_PUBLIC_SITE_URL = "https://sorell.fr";
  });

  it("returns 429 when rate limit is exceeded", async () => {
    mockRateLimit.mockResolvedValue({ success: false });
    const request = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: "price_pro_monthly" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(429);
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);
    const request = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: "price_pro_monthly" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("returns 400 when priceId is missing", async () => {
    const request = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when priceId is not in whitelist", async () => {
    const request = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: "price_fake_id" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid price");
  });

  it("returns checkout URL for valid priceId", async () => {
    const request = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: "price_pro_monthly" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.url).toBe("https://checkout.stripe.com/session-123");
  });

  it("passes trial_period_days: 15 to Stripe", async () => {
    const request = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: "price_pro_monthly" }),
    });
    await POST(request);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_data: { trial_period_days: 15 },
      })
    );
  });

  it("uses onboarding success URL when fromOnboarding is true", async () => {
    const request = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: "price_business_monthly", fromOnboarding: true }),
    });
    await POST(request);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: "https://sorell.fr/dashboard?onboarding=true",
        cancel_url: "https://sorell.fr/dashboard",
      })
    );
  });

  // --- Parrainage : le montant de la remise (amount_off) doit rester < prix plein,
  // sinon le 1er mois passe à 0€. Ces montants correspondent à -20% arrondi au
  // chiffre en dessous (Pro 9,99€ → 7€ ; Business 49€ → 39€). ---
  it("applies a 2,99€ referral discount for Pro (9,99€ → 7€), never a free month", async () => {
    mockState.referral = { id: "ref-1", referrer_id: "user-parrain", expires_at: "2099-01-01T00:00:00.000Z" };
    const request = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: "price_pro_monthly" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);

    // La remise Pro doit être 299 centimes (2,99€), strictement < 999 (9,99€).
    expect(mockCoupons.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount_off: 299, currency: "eur", duration: "once" })
    );
    const arg = mockCoupons.create.mock.calls[0][0] as { amount_off: number };
    expect(arg.amount_off).toBeLessThan(999);
  });

  it("applies a 10€ referral discount for Business (49€ → 39€)", async () => {
    mockState.referral = { id: "ref-2", referrer_id: "user-parrain", expires_at: "2099-01-01T00:00:00.000Z" };
    const request = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: "price_business_monthly" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(mockCoupons.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount_off: 1000, currency: "eur", duration: "once" })
    );
    const arg = mockCoupons.create.mock.calls[0][0] as { amount_off: number };
    expect(arg.amount_off).toBeLessThan(4900);
  });
});
