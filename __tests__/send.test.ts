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

// Mock Resend
vi.mock("resend", () => {
  const mockSend = vi.fn();
  return {
    Resend: class {
      emails = { send: mockSend };
    },
    __mockSend: mockSend,
  };
});

// Mock email template
vi.mock("@/lib/email-template", () => ({
  buildNewsletterHtml: () => "<html>newsletter</html>",
}));

// Supabase mock state
let mockNewsletterData: Record<string, unknown> | null = null;
let mockRecipientsData: Array<{ email: string; user_id: string }> | null = null;
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

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

describe("POST /api/send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    mockLimit.mockResolvedValue({ success: true });
    mockSend.mockResolvedValue({ data: { id: "email-123" }, error: null });

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
    expect(mockSend).toHaveBeenCalledTimes(2);
    expect(data.results[0].email).toBe("recipient1@test.com");
    expect(data.results[1].email).toBe("recipient2@test.com");
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
