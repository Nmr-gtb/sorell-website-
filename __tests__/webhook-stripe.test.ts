import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase admin
const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });
const mockSelectEqSingle = vi.fn();
// Idempotence : insert() réserve l'event.id, delete().eq() libère en cas d'échec.
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: () => ({
      update: (...args: unknown[]) => mockUpdate(...args),
      insert: (...args: unknown[]) => mockInsert(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
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

// Mock Resend
const mockSendEmail = vi.fn().mockResolvedValue({ id: "email-123" });
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: (...args: unknown[]) => mockSendEmail(...args) };
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
    mockInsert.mockResolvedValue({ error: null });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockDeleteEq.mockResolvedValue({ error: null });
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

  it("réserve l'event.id avant traitement (idempotence)", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_abc",
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_123" } },
    });

    const request = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "valid-sig" },
      body: "{}",
    });
    await POST(request);

    expect(mockInsert).toHaveBeenCalledWith({ id: "evt_abc", type: "customer.subscription.deleted" });
  });

  it("ignore un rejeu Stripe déjà traité (event.id en doublon) sans retraiter", async () => {
    // L'insert de réservation échoue avec une violation d'unicité (23505) → rejeu.
    mockInsert.mockResolvedValue({ error: { code: "23505", message: "duplicate key" } });
    mockConstructEvent.mockReturnValue({
      id: "evt_dup",
      type: "checkout.session.completed",
      data: { object: { metadata: { userId: "user-123" }, subscription: "sub_123", customer: "cus_123" } },
    });

    const request = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "valid-sig" },
      body: "{}",
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.duplicate).toBe(true);

    // Aucun traitement : ni retrieve d'abonnement, ni update de profil.
    expect(mockRetrieveSubscription).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("libère la réservation si le traitement échoue (permet le rejeu Stripe)", async () => {
    // L'update du profil échoue → le handler throw → 500 + rollback de la réservation.
    mockUpdateEq.mockResolvedValue({ error: { message: "db down" } });
    mockConstructEvent.mockReturnValue({
      id: "evt_fail",
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_123" } },
    });

    const request = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "valid-sig" },
      body: "{}",
    });
    const response = await POST(request);
    expect(response.status).toBe(500);

    // La réservation evt_fail doit être supprimée pour autoriser le rejeu.
    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith("id", "evt_fail");
  });
});
