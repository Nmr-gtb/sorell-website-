import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/mock" }),
      },
    },
  },
  PRICE_IDS: {
    pro_monthly: "price_pro_monthly",
    pro_annual: "price_pro_annual",
    business_monthly: "price_business_monthly",
    business_annual: "price_business_annual",
  },
}));

import { POST } from "@/app/api/checkout/route";
import { stripe } from "@/lib/stripe";

const mockCreate = stripe.checkout.sessions.create as ReturnType<typeof vi.fn>;

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ url: "https://checkout.stripe.com/session-123" });
    process.env.NEXT_PUBLIC_SITE_URL = "https://sorell.fr";
  });

  it("returns 400 when priceId is missing", async () => {
    const request = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "user-123" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when userId is missing", async () => {
    const request = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: "price_pro_monthly" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when priceId is not in whitelist", async () => {
    const request = new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: "price_fake_id", userId: "user-123" }),
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
      body: JSON.stringify({
        priceId: "price_pro_monthly",
        userId: "user-123",
        userEmail: "test@example.com",
      }),
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
      body: JSON.stringify({
        priceId: "price_pro_monthly",
        userId: "user-123",
        userEmail: "test@example.com",
      }),
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
      body: JSON.stringify({
        priceId: "price_business_monthly",
        userId: "user-123",
        userEmail: "test@example.com",
        fromOnboarding: true,
      }),
    });
    await POST(request);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: "https://sorell.fr/dashboard?onboarding=true",
        cancel_url: "https://sorell.fr/dashboard",
      })
    );
  });
});
