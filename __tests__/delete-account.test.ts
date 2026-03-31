import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
const mockGetAuthenticatedUser = vi.fn();
vi.mock("@/lib/auth", () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));

// Mock Supabase
const mockSelect = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [] }) });
const mockDeleteFrom = vi.fn().mockReturnValue({
  delete: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
    in: vi.fn().mockResolvedValue({ error: null }),
  }),
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: vi.fn().mockResolvedValue({ data: [] }),
      }),
      delete: () => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
        in: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  }),
}));

import { POST } from "@/app/api/delete-account/route";

describe("POST /api/delete-account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "user-123" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("returns 403 when userId does not match authenticated user", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });

    const request = new Request("http://localhost/api/delete-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({ userId: "user-456" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it("returns 200 when userId matches authenticated user", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });

    const request = new Request("http://localhost/api/delete-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({ userId: "user-123" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
