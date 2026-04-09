import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
const mockGetAuthenticatedUser = vi.fn();
vi.mock("@/lib/auth", () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));

// Mock rate limiter
const mockEmailRateLimit = vi.fn();
vi.mock("@/lib/ratelimit", () => ({
  emailRateLimit: { limit: (...args: unknown[]) => mockEmailRateLimit(...args) },
}));

// Mock Resend
vi.mock("resend", () => {
  const mockSend = vi.fn().mockResolvedValue({ id: "email-123" });
  return {
    Resend: class {
      emails = { send: mockSend };
    },
    __mockSend: mockSend,
  };
});

// Mock react-email render (avoid heavy JSX rendering in tests)
vi.mock("@react-email/components", () => ({
  render: async () => "<html>mocked welcome email</html>",
}));

// Mock WelcomeEmail component
vi.mock("@/emails/WelcomeEmail", () => ({
  WelcomeEmail: () => "mocked",
}));

// Mock verify-email-token
vi.mock("@/lib/verify-email-token", () => ({
  buildVerifyEmailUrl: (email: string) => `https://www.sorell.fr/api/verify-email?email=${email}&token=mock-token`,
}));

import { POST } from "@/app/api/welcome/route";
import * as resendModule from "resend";

const mockSend = (resendModule as unknown as { __mockSend: ReturnType<typeof vi.fn> }).__mockSend;

function buildRequest(body: unknown, options?: { auth?: boolean }) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options?.auth) {
    headers["Authorization"] = "Bearer test-token";
  }
  return new Request("http://localhost/api/welcome", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/welcome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockEmailRateLimit.mockResolvedValue({ success: true });
    mockSend.mockResolvedValue({ id: "email-123" });
  });

  it("retourne 401 si non authentifie", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);
    const request = buildRequest({ email: "test@example.com", name: "Test" });
    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toContain("Non autoris");
  });

  it("retourne 400 si email manquant", async () => {
    const request = buildRequest({ name: "Test" }, { auth: true });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Missing email");
  });

  it("retourne 400 si email invalide", async () => {
    const request = buildRequest({ email: "not-an-email", name: "Test" }, { auth: true });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Format email invalide");
  });

  it("retourne 429 si rate limit depasse", async () => {
    mockEmailRateLimit.mockResolvedValue({ success: false });
    const request = buildRequest({ email: "test@example.com", name: "Test" }, { auth: true });
    const response = await POST(request);
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toContain("Trop de requ");
  });

  it("retourne 200 et envoie 2 emails (bienvenue + notification admin)", async () => {
    const request = buildRequest(
      { email: "john@example.com", name: "John Doe" },
      { auth: true }
    );
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // 2 emails: welcome to user + notification to admin
    expect(mockSend).toHaveBeenCalledTimes(2);

    // First call: welcome email to user
    const welcomeCall = mockSend.mock.calls[0][0];
    expect(welcomeCall.to).toBe("john@example.com");
    expect(welcomeCall.subject).toContain("Bienvenue sur Sorell");
    expect(welcomeCall.html).toBeDefined();

    // Second call: notification to admin
    const adminCall = mockSend.mock.calls[1][0];
    expect(adminCall.to).toBe("noe@sorell.fr");
    expect(adminCall.subject).toContain("Nouvel inscrit");
  });

  it("retourne 200 meme si email vide pour le nom (name optionnel)", async () => {
    const request = buildRequest(
      { email: "test@example.com", name: "" },
      { auth: true }
    );
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it("continue si Redis est indisponible (rate limiter en erreur)", async () => {
    mockEmailRateLimit.mockRejectedValue(new Error("Redis connection failed"));
    const request = buildRequest(
      { email: "test@example.com", name: "Test" },
      { auth: true }
    );
    const response = await POST(request);
    // Route allows emails through when Redis is down
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it("retourne 500 si Resend echoue", async () => {
    mockSend.mockRejectedValue(new Error("Resend API error"));
    const request = buildRequest(
      { email: "test@example.com", name: "Test" },
      { auth: true }
    );
    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Une erreur est survenue");
  });
});
