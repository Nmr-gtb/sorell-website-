import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock unsubscribe-token
const mockVerifyUnsubscribeToken = vi.fn();
vi.mock("@/lib/unsubscribe-token", () => ({
  verifyUnsubscribeToken: (...args: unknown[]) => mockVerifyUnsubscribeToken(...args),
}));

// Mock Supabase admin
const mockDeleteEq = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: () => ({
      delete: () => mockDelete(),
    }),
  },
}));

import { GET, POST } from "@/app/api/unsubscribe/route";

describe("GET /api/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to success when token is valid and deletion succeeds", async () => {
    mockVerifyUnsubscribeToken.mockReturnValue(true);

    const request = new Request(
      "http://localhost/api/unsubscribe?email=user@test.com&token=valid-token-123"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/desabonnement?status=success");
    expect(location).toContain("email=user%40test.com");
    expect(mockVerifyUnsubscribeToken).toHaveBeenCalledWith("user@test.com", "valid-token-123");
  });

  it("redirects to error when token is invalid", async () => {
    mockVerifyUnsubscribeToken.mockReturnValue(false);

    const request = new Request(
      "http://localhost/api/unsubscribe?email=user@test.com&token=bad-token"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/desabonnement?status=error");
  });

  it("redirects to error when email is missing", async () => {
    const request = new Request(
      "http://localhost/api/unsubscribe?token=some-token"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/desabonnement?status=error");
    // Should not even attempt verification
    expect(mockVerifyUnsubscribeToken).not.toHaveBeenCalled();
  });

  it("redirects to error when token is empty", async () => {
    const request = new Request(
      "http://localhost/api/unsubscribe?email=user@test.com&token="
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/desabonnement?status=error");
  });
});

describe("POST /api/unsubscribe (one-click RFC 8058)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 {unsubscribed:true} on a valid one-click POST", async () => {
    mockVerifyUnsubscribeToken.mockReturnValue(true);
    const request = new Request(
      "http://localhost/api/unsubscribe?email=user@test.com&token=valid-token&uid=user-123",
      { method: "POST" }
    );
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ unsubscribed: true });
    expect(mockDelete).toHaveBeenCalled();
  });

  it("returns 200 {unsubscribed:false} on an invalid token without leaking", async () => {
    mockVerifyUnsubscribeToken.mockReturnValue(false);
    const request = new Request(
      "http://localhost/api/unsubscribe?email=user@test.com&token=bad",
      { method: "POST" }
    );
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ unsubscribed: false });
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
