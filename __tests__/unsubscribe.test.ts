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

import { GET } from "@/app/api/unsubscribe/route";

describe("GET /api/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to error when token is valid and deletion succeeds", async () => {
    // Actually test valid token -> success redirect
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
