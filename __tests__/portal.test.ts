import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetAuthenticatedUser = vi.fn();
vi.mock("@/lib/auth", () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));

const mockBillingPortalCreate = vi.fn();
vi.mock("@/lib/stripe", () => ({
  stripe: {
    billingPortal: {
      sessions: {
        create: (...args: unknown[]) => mockBillingPortalCreate(...args),
      },
    },
  },
}));

const mockSupabaseSingle = vi.fn();
vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => mockSupabaseSingle(),
        }),
      }),
    }),
  },
}));

import { POST } from "@/app/api/portal/route";

describe("POST /api/portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockSupabaseSingle.mockResolvedValue({
      data: { stripe_customer_id: "cus_abc123" },
      error: null,
    });
    mockBillingPortalCreate.mockResolvedValue({ url: "https://billing.stripe.com/session/mock" });
    process.env.NEXT_PUBLIC_SITE_URL = "https://sorell.fr";
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);
    const request = new Request("http://localhost/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "user-123" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Non autorise");
  });

  it("returns 403 when userId does not match authenticated user", async () => {
    const request = new Request("http://localhost/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "other-user-456" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Non autorise");
  });

  it("returns 403 when userId is missing", async () => {
    const request = new Request("http://localhost/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Non autorise");
  });

  it("returns 400 when user has no stripe_customer_id", async () => {
    mockSupabaseSingle.mockResolvedValue({
      data: { stripe_customer_id: null },
      error: null,
    });
    const request = new Request("http://localhost/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "user-123" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("No subscription found");
  });

  it("returns 400 when profile is not found", async () => {
    mockSupabaseSingle.mockResolvedValue({
      data: null,
      error: null,
    });
    const request = new Request("http://localhost/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "user-123" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("No subscription found");
  });

  it("returns billing portal URL for user with stripe_customer_id", async () => {
    const request = new Request("http://localhost/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "user-123" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.url).toBe("https://billing.stripe.com/session/mock");
  });

  it("calls stripe.billingPortal.sessions.create with correct parameters", async () => {
    const request = new Request("http://localhost/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "user-123" }),
    });
    await POST(request);
    expect(mockBillingPortalCreate).toHaveBeenCalledWith({
      customer: "cus_abc123",
      return_url: "https://sorell.fr/dashboard/profile",
    });
  });

  it("returns 500 when stripe billing portal creation fails", async () => {
    mockBillingPortalCreate.mockRejectedValue(new Error("Stripe API error"));
    const request = new Request("http://localhost/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "user-123" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Une erreur est survenue");
  });

  it("uses fallback URL when NEXT_PUBLIC_SITE_URL is not set", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const request = new Request("http://localhost/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "user-123" }),
    });
    await POST(request);
    expect(mockBillingPortalCreate).toHaveBeenCalledWith({
      customer: "cus_abc123",
      return_url: "https://sorell.fr/dashboard/profile",
    });
  });
});
