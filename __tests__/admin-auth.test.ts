import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const mockLimit = vi.fn();
vi.mock("@/lib/ratelimit", () => ({
  adminLoginRateLimit: { limit: (...args: unknown[]) => mockLimit(...args) },
}));

const mockVerifyAdminCredentials = vi.fn();
const mockGenerateAdminToken = vi.fn();
const mockGetAuthenticatedAdmin = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  verifyAdminCredentials: (...args: unknown[]) => mockVerifyAdminCredentials(...args),
  generateAdminToken: (...args: unknown[]) => mockGenerateAdminToken(...args),
  getAuthenticatedAdmin: (...args: unknown[]) => mockGetAuthenticatedAdmin(...args),
  TOKEN_EXPIRY_MS: 86400000,
}));

const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: () => ({
      insert: (...args: unknown[]) => mockInsert(...args),
    }),
  },
}));

// --- Imports ---

import { POST as loginPOST } from "@/app/api/admin/login/route";
import { POST as logoutPOST } from "@/app/api/admin/logout/route";
import { GET as verifyGET } from "@/app/api/admin/verify/route";

// --- Helpers ---

function buildLoginRequest(body: Record<string, unknown>, headers?: Record<string, string>) {
  return new Request("http://localhost/api/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function buildVerifyRequest(cookie?: string) {
  const headers: Record<string, string> = {};
  if (cookie) headers["cookie"] = cookie;
  return new Request("http://localhost/api/admin/verify", {
    method: "GET",
    headers,
  });
}

// --- Tests ---

describe("POST /api/admin/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLimit.mockResolvedValue({ success: true });
    mockVerifyAdminCredentials.mockResolvedValue(true);
    mockGenerateAdminToken.mockReturnValue("jwt-token-123");
  });

  it("returns 200 + cookie on valid credentials", async () => {
    const res = await loginPOST(buildLoginRequest({ email: "noe@sorell.fr", password: "secret" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("admin_token=jwt-token-123");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie?.toLowerCase()).toContain("samesite=strict");
  });

  it("returns 429 when rate limited", async () => {
    mockLimit.mockResolvedValue({ success: false });
    const res = await loginPOST(buildLoginRequest({ email: "noe@sorell.fr", password: "secret" }));
    expect(res.status).toBe(429);
  });

  it("returns 503 when Redis is down (fail-closed)", async () => {
    mockLimit.mockRejectedValue(new Error("Redis unavailable"));
    const res = await loginPOST(buildLoginRequest({ email: "noe@sorell.fr", password: "secret" }));
    expect(res.status).toBe(503);
  });

  it("returns 400 for missing email or password", async () => {
    const res1 = await loginPOST(buildLoginRequest({ email: "noe@sorell.fr" }));
    expect(res1.status).toBe(400);

    const res2 = await loginPOST(buildLoginRequest({ password: "secret" }));
    expect(res2.status).toBe(400);

    const res3 = await loginPOST(buildLoginRequest({}));
    expect(res3.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "127.0.0.1" },
      body: "not-json",
    });
    const res = await loginPOST(req);
    expect(res.status).toBe(400);
  });

  it("returns 401 for invalid email format", async () => {
    const res = await loginPOST(buildLoginRequest({ email: "not-an-email", password: "secret" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 for password > 72 chars (bcrypt DoS protection)", async () => {
    const longPassword = "a".repeat(73);
    const res = await loginPOST(buildLoginRequest({ email: "noe@sorell.fr", password: longPassword }));
    expect(res.status).toBe(401);
  });

  it("returns 401 for wrong credentials", async () => {
    mockVerifyAdminCredentials.mockResolvedValue(false);
    const res = await loginPOST(buildLoginRequest({ email: "noe@sorell.fr", password: "wrong" }));
    expect(res.status).toBe(401);
  });

  it("logs admin session to Supabase (non-blocking)", async () => {
    await loginPOST(buildLoginRequest({ email: "noe@sorell.fr", password: "secret" }));
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "noe@sorell.fr",
        ip_address: "127.0.0.1",
      })
    );
  });

  it("still succeeds even if session logging fails", async () => {
    mockInsert.mockRejectedValue(new Error("DB error"));
    const res = await loginPOST(buildLoginRequest({ email: "noe@sorell.fr", password: "secret" }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/admin/logout", () => {
  it("returns 200 and clears the admin_token cookie", async () => {
    mockGetAuthenticatedAdmin.mockReturnValue({ email: "noe@sorell.fr", role: "admin" });
    const req = new Request("http://localhost/api/admin/logout", {
      method: "POST",
      headers: { cookie: "admin_token=jwt-token-123" },
    });
    const res = await logoutPOST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("admin_token=");
    expect(setCookie).toContain("Max-Age=0");
  });
});

describe("GET /api/admin/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthenticatedAdmin.mockReturnValue(null);
    const res = await verifyGET(buildVerifyRequest());
    expect(res.status).toBe(401);
  });

  it("returns admin email when authenticated", async () => {
    mockGetAuthenticatedAdmin.mockReturnValue({ email: "noe@sorell.fr", role: "admin" });
    const res = await verifyGET(buildVerifyRequest("admin_token=jwt-token-123"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.email).toBe("noe@sorell.fr");
  });
});
