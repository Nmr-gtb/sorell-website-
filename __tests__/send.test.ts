import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
const mockGetAuthenticatedUser = vi.fn();
vi.mock("@/lib/auth", () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));

// Mock rate limit
const mockLimit = vi.fn();
vi.mock("@/lib/ratelimit", () => ({
  apiRateLimit: { limit: (...args: unknown[]) => mockLimit(...args) },
}));

// Mock Resend — l'envoi passe par l'API batch (lib/send-newsletter-batch).
vi.mock("resend", () => {
  const mockSend = vi.fn();
  const mockBatchSend = vi.fn();
  return {
    Resend: class {
      emails = { send: mockSend };
      batch = { send: mockBatchSend };
    },
    __mockSend: mockSend,
    __mockBatchSend: mockBatchSend,
  };
});

// Mock email template
vi.mock("@/lib/email-template", () => ({
  buildNewsletterHtml: async () => "<html>newsletter</html>",
}));

// Supabase mock state
let mockNewsletterData: Record<string, unknown> | null = null;
let mockRecipientsData: Array<{ email: string; user_id: string }> | null = null;
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
// Mode éditeur : /api/send libère pending_draft_id via update().eq().eq()
const mockConfigUpdate = vi.fn().mockReturnValue({
  eq: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }),
});

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === "newsletters") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: mockNewsletterData,
                    error: mockNewsletterData ? null : { message: "not found" },
                  }),
              }),
              single: () =>
                Promise.resolve({
                  data: mockNewsletterData,
                  error: mockNewsletterData ? null : { message: "not found" },
                }),
            }),
          }),
          update: (...args: unknown[]) => mockUpdate(...args),
        };
      }
      if (table === "newsletter_config") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { brand_color: "#005058", custom_logo_url: null, text_color: "#111827", bg_color: "#FFFFFF", body_text_color: "#4B5563" },
                  error: null,
                }),
            }),
          }),
          update: (...args: unknown[]) => mockConfigUpdate(...args),
        };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { plan: "pro" }, error: null }),
            }),
          }),
        };
      }
      if (table === "recipients") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockRecipientsData }),
          }),
        };
      }
      return {
        select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }), single: () => Promise.resolve({ data: null, error: null }) }) }),
      };
    },
  },
}));

import { POST } from "@/app/api/send/route";
import * as resendModule from "resend";

const mockSend = (resendModule as unknown as { __mockSend: ReturnType<typeof vi.fn> }).__mockSend;
const mockBatchSend = (resendModule as unknown as { __mockBatchSend: ReturnType<typeof vi.fn> }).__mockBatchSend;

describe("POST /api/send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    process.env.UNSUBSCRIBE_SECRET = "test-unsubscribe-secret";
    mockLimit.mockResolvedValue({ success: true });
    mockSend.mockResolvedValue({ data: { id: "email-123" }, error: null });
    // batch.send : succès pour chaque email du lot, ids dans l'ordre du payload
    mockBatchSend.mockImplementation((payload: Array<{ to: string }>) =>
      Promise.resolve({
        data: { data: payload.map((_, i) => ({ id: `email-${i}` })), errors: [] },
        error: null,
      })
    );

    // Default: newsletter exists with content
    mockNewsletterData = {
      id: "nl-123",
      user_id: "user-123",
      subject: "Test Newsletter",
      content: {
        editorial: "Test editorial",
        key_figures: [],
        articles: [
          {
            tag: "TECH",
            title: "Article 1",
            hook: "Hook",
            content: "Content",
            source: "Source",
            url: "https://example.com",
            featured: true,
          },
        ],
      },
      status: "draft",
    };
    mockRecipientsData = [
      { email: "recipient1@test.com", user_id: "user-123" },
      { email: "recipient2@test.com", user_id: "user-123" },
    ];
  });

  it("returns 401 if not authenticated", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newsletterId: "nl-123" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("returns 404 if newsletter not found", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockNewsletterData = null;

    const request = new Request("http://localhost/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({ newsletterId: "nl-999", userId: "user-123" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Newsletter not found");
  });

  it("returns 400 if no recipients", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockRecipientsData = [];

    const request = new Request("http://localhost/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({ newsletterId: "nl-123", userId: "user-123" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("No recipients configured");
  });

  it("sends to multiple recipients and returns success", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });

    const request = new Request("http://localhost/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({ newsletterId: "nl-123", userId: "user-123" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.results).toHaveLength(2);
    // Envoi groupé : 1 seul appel batch pour les 2 destinataires
    expect(mockBatchSend).toHaveBeenCalledTimes(1);
    const payload = mockBatchSend.mock.calls[0][0] as Array<{
      to: string;
      subject: string;
      headers: Record<string, string>;
      tags: Array<{ name: string; value: string }>;
    }>;
    expect(payload).toHaveLength(2);
    expect(payload[0].to).toBe("recipient1@test.com");
    expect(payload[1].to).toBe("recipient2@test.com");
    // Le one-click unsubscribe et les tags d'attribution voyagent avec chaque email
    expect(payload[0].headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(payload[0].tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "newsletter_id", value: "nl-123" }),
        expect.objectContaining({ name: "user_id", value: "user-123" }),
      ])
    );
    expect(data.results[0].email).toBe("recipient1@test.com");
    expect(data.results[1].email).toBe("recipient2@test.com");
  });

  it("clears pending_draft_id on the config after a successful send (editor mode)", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });

    const request = new Request("http://localhost/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({ newsletterId: "nl-123", userId: "user-123" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    // La libération du brouillon en attente est conditionnelle (filtre .eq sur
    // pending_draft_id) mais l'update doit toujours être tenté, avec
    // last_sent_at pour éviter un double envoi le même jour côté cron
    expect(mockConfigUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        pending_draft_id: null,
        last_sent_at: expect.any(String),
      })
    );
  });

  it("returns 200 with per-recipient failures when all sends fail", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockBatchSend.mockRejectedValue(new Error("SMTP unavailable"));

    const request = new Request("http://localhost/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({ newsletterId: "nl-123", userId: "user-123" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.results).toHaveLength(2);
    expect(data.results.every((r: { success: boolean }) => r.success === false)).toBe(true);
    // Le message d'erreur reste générique, sans détail technique
    expect(data.results[0].error).toBe("Échec de l'envoi.");
    expect(JSON.stringify(data.results)).not.toContain("SMTP");
  });

  it("counts only the really sent emails on a partial batch failure (permissive mode)", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    // Le 1er email du lot est rejeté (index 0), le 2e part correctement.
    mockBatchSend.mockResolvedValue({
      data: { data: [{ id: "email-ok" }], errors: [{ index: 0 }] },
      error: null,
    });

    const request = new Request("http://localhost/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({ newsletterId: "nl-123", userId: "user-123" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.results).toHaveLength(2);
    expect(data.results[0]).toMatchObject({ email: "recipient1@test.com", success: false });
    expect(data.results[1]).toMatchObject({ email: "recipient2@test.com", success: true, id: "email-ok" });

    // recipient_count reflète le nombre réellement envoyé (1), pas la taille de la liste (2)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "sent", recipient_count: 1 })
    );
  });

  it("returns 429 if rate limited", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockLimit.mockResolvedValue({ success: false });

    const request = new Request("http://localhost/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({ newsletterId: "nl-123", userId: "user-123" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(429);
  });

  it("returns 403 if userId mismatch", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });

    const request = new Request("http://localhost/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({ newsletterId: "nl-123", userId: "user-456" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(403);
  });
});
