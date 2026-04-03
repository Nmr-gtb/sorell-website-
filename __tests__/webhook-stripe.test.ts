import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase admin
const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });
const mockSelectEqSingle = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: () => ({
      update: (...args: unknown[]) => mockUpdate(...args),
      select: () => ({
        eq: () => ({
          single: () => mockSelectEqSingle(),
          maybeSingle: () => mockSelectEqSingle(),
          eq: () => ({
            maybeSingle: () => mockSelectEqSingle(),
          }),
        }),
      }),
    }),
  },
}));

// Mock Stripe
const mockConstructEvent = vi.fn();
const mockRetrieveSubscription = vi.fn();

vi.mock("stripe", () => ({
  default: class {
    webhooks = { constructEvent: mockConstructEvent };
    subscriptions = { retrieve: mockRetrieveSubscription };
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: { constructEvent: (...args: unknown[]) => mockConstructEvent(...args) },
    subscriptions: { retrieve: (...args: unknown[]) => mockRetrieveSubscription(...args) },
  },
  PRICE_TO_PLAN: {
    price_pro_monthly: "pro",
    price_pro_annual: "pro",
    price_business_monthly: "business",
    price_business_annual: "business",
  },
}));

import { POST } from "@/app/api/webhooks/stripe/route";

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    mockSelectEqSingle.mockResolvedValue({ data: { id: "user-123" }, error: null });
  });

  it("returns 400 if invalid signature", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const request = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "invalid-sig" },
      body: "{}",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid signature");
  });

  it("handles checkout.session.completed and updates profile with plan and trial_ends_at", async () => {
    const trialEndTimestamp = Math.floor(Date.now() / 1000) + 15 * 24 * 60 * 60; // 15 days from now

    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { userId: "user-123" },
          subscription: "sub_123",
          customer: "cus_123",
        },
      },
    });

    mockRetrieveSubscription.mockResolvedValue({
      items: { data: [{ price: { id: "price_pro_monthly" } }] },
      trial_end: trialEndTimestamp,
    });

    const request = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "valid-sig" },
      body: "{}",
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.received).toBe(true);

    // Verify profile was updated with correct plan and trial_ends_at
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: "pro",
        stripe_customer_id: "cus_123",
        stripe_subscription_id: "sub_123",
        trial_ends_at: expect.any(String),
      })
    );
    expect(mockRetrieveSubscription).toHaveBeenCalledWith("sub_123");
  });

  it("handles customer.subscription.deleted and downgrades to free", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: {
        object: {
          customer: "cus_123",
        },
      },
    });

    const request = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "valid-sig" },
      body: "{}",
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.received).toBe(true);

    // Verify profile was downgraded to free
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: "free",
        stripe_subscription_id: null,
      })
    );
  });

  it("handles customer.subscription.updated and updates plan", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          customer: "cus_123",
          items: { data: [{ price: { id: "price_business_monthly" } }] },
        },
      },
    });

    const request = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "valid-sig" },
      body: "{}",
    });
    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: "business",
      })
    );
  });
});
