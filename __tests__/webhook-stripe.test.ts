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

// Même mapping factice pour @/lib/price-ids (importé directement par la route
// pour planForSubscriptionStatus). La logique réelle du helper est testée avec
// les vrais price IDs dans stripe-config.test.ts ; ici on vérifie le CÂBLAGE
// du handler (statut → plan écrit en base).
vi.mock("@/lib/price-ids", () => {
  const PRICE_TO_PLAN: Record<string, string> = {
    price_pro_monthly: "pro",
    price_pro_annual: "pro",
    price_business_monthly: "business",
    price_business_annual: "business",
  };
  const GRACE = new Set(["active", "trialing", "past_due"]);
  return {
    PRICE_IDS: {
      pro_monthly: "price_pro_monthly",
      pro_annual: "price_pro_annual",
      business_monthly: "price_business_monthly",
      business_annual: "price_business_annual",
    },
    LEGACY_PRICE_TO_PLAN: {},
    PRICE_TO_PLAN,
    planForSubscriptionStatus: (status: string, priceId?: string) => {
      const paid = (priceId && PRICE_TO_PLAN[priceId]) || "free";
      return GRACE.has(status) ? paid : "free";
    },
  };
});

import { POST } from "@/app/api/webhooks/stripe/route";

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    // Requis par notifyAdmin (garde anti-appel réseau quand la clé est absente)
    process.env.RESEND_API_KEY = "re_test_key";
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
          status: "active",
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
        stripe_subscription_status: "active",
      })
    );
  });

  // --- Gating par statut : le plan effectif dépend de subscription.status,
  // pas seulement du prix. past_due = grâce (relance Stripe en cours),
  // unpaid/canceled/paused = coupure immédiate vers free. ---
  it("keeps the premium plan during the Stripe dunning window (past_due)", async () => {
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          customer: "cus_123",
          status: "past_due",
          items: { data: [{ price: { id: "price_pro_monthly" } }] },
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
        plan: "pro",
        stripe_subscription_status: "past_due",
      })
    );
  });

  it("downgrades to free when Stripe marks the subscription unpaid", async () => {
    // Cas clé : config Stripe "mark as unpaid" (pas d'annulation auto) —
    // aucun customer.subscription.deleted n'arrivera jamais.
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          customer: "cus_123",
          status: "unpaid",
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
        plan: "free",
        stripe_subscription_status: "unpaid",
      })
    );
  });

  it("downgrades to free when the subscription is canceled or paused", async () => {
    for (const status of ["canceled", "paused"]) {
      vi.clearAllMocks();
      mockInsert.mockResolvedValue({ error: null });
      mockUpdateEq.mockResolvedValue({ error: null });
      mockSelectEqSingle.mockResolvedValue({ data: { id: "user-123" }, error: null });
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: {
          object: {
            customer: "cus_123",
            status,
            items: { data: [{ price: { id: "price_pro_monthly" } }] },
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
        expect.objectContaining({ plan: "free", stripe_subscription_status: status })
      );
    }
  });

  it("envoie une notif email à Noé lors d'un nouvel abonnement payant", async () => {
    const trialEnd = Math.floor(Date.now() / 1000) + 15 * 24 * 60 * 60;
    mockSelectEqSingle.mockResolvedValue({
      data: { id: "user-123", full_name: "Camille Test", email: "abonne@test.com" },
      error: null,
    });
    mockConstructEvent.mockReturnValue({
      id: "evt_notif",
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
      trial_end: trialEnd,
      status: "trialing",
    });

    const request = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "valid-sig" },
      body: "{}",
    });
    const response = await POST(request);
    expect(response.status).toBe(200);

    // La notif part vers noe@sorell.fr avec le plan et l'email de l'abonné
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "noe@sorell.fr",
        subject: expect.stringContaining("Nouvel abonnement Pro"),
      })
    );
    const sent = mockSendEmail.mock.calls[0][0] as { subject: string; text: string };
    expect(sent.subject).toContain("abonne@test.com");
    expect(sent.text).toContain("Camille Test");
  });

  it("notifie Noé quand une résiliation est programmée depuis le portail", async () => {
    mockSelectEqSingle.mockResolvedValue({
      data: { id: "user-123", email: "abonne@test.com", plan: "pro" },
      error: null,
    });
    mockConstructEvent.mockReturnValue({
      id: "evt_cancel_sched",
      type: "customer.subscription.updated",
      data: {
        object: {
          customer: "cus_123",
          status: "trialing",
          cancel_at_period_end: true,
          cancel_at: 1785000000,
          items: { data: [{ price: { id: "price_pro_monthly" }, current_period_end: 1785000000 }] },
        },
        previous_attributes: { cancel_at_period_end: false },
      },
    });

    const request = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "valid-sig" },
      body: "{}",
    });
    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "noe@sorell.fr",
        subject: expect.stringContaining("Résiliation programmée"),
      })
    );
    const sent = mockSendEmail.mock.calls[0][0] as { subject: string; text: string };
    expect(sent.subject).toContain("abonne@test.com");
    expect(sent.text).toContain("Fin d'accès");
  });

  it("notifie Noé quand une résiliation est annulée (réactivation)", async () => {
    mockSelectEqSingle.mockResolvedValue({
      data: { id: "user-123", email: "abonne@test.com", plan: "pro" },
      error: null,
    });
    mockConstructEvent.mockReturnValue({
      id: "evt_cancel_undo",
      type: "customer.subscription.updated",
      data: {
        object: {
          customer: "cus_123",
          status: "active",
          cancel_at_period_end: false,
          items: { data: [{ price: { id: "price_pro_monthly" } }] },
        },
        previous_attributes: { cancel_at_period_end: true },
      },
    });

    const request = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "valid-sig" },
      body: "{}",
    });
    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "noe@sorell.fr",
        subject: expect.stringContaining("Résiliation annulée"),
      })
    );
  });

  it("ne notifie PAS sur un subscription.updated ordinaire (renouvellement)", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_ordinary_update",
      type: "customer.subscription.updated",
      data: {
        object: {
          customer: "cus_123",
          status: "active",
          cancel_at_period_end: false,
          items: { data: [{ price: { id: "price_pro_monthly" } }] },
        },
        previous_attributes: { current_period_start: 1784000000 },
      },
    });

    const request = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "valid-sig" },
      body: "{}",
    });
    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("notifie Noé quand un abonnement se termine (subscription.deleted)", async () => {
    mockSelectEqSingle.mockResolvedValue({
      data: { id: "user-123", email: "abonne@test.com", plan: "business" },
      error: null,
    });
    mockConstructEvent.mockReturnValue({
      id: "evt_sub_ended",
      type: "customer.subscription.deleted",
      data: {
        object: {
          customer: "cus_123",
          status: "canceled",
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

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "noe@sorell.fr",
        subject: expect.stringContaining("Abonnement terminé"),
      })
    );
    const sent = mockSendEmail.mock.calls[0][0] as { text: string };
    expect(sent.text).toContain("Business");
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
