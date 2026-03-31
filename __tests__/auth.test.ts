import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase before importing auth
vi.mock("@supabase/supabase-js", () => {
  const mockGetUser = vi.fn();
  return {
    createClient: () => ({
      auth: { getUser: mockGetUser },
    }),
    __mockGetUser: mockGetUser,
  };
});

import { getAuthenticatedUser } from "@/lib/auth";
import * as supabaseModule from "@supabase/supabase-js";

const mockGetUser = (supabaseModule as unknown as { __mockGetUser: ReturnType<typeof vi.fn> }).__mockGetUser;

describe("getAuthenticatedUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no Authorization header", async () => {
    const request = new Request("http://localhost/api/test", {
      headers: {},
    });
    const result = await getAuthenticatedUser(request);
    expect(result).toBeNull();
  });

  it("returns null when Authorization header is not Bearer", async () => {
    const request = new Request("http://localhost/api/test", {
      headers: { Authorization: "Basic abc123" },
    });
    const result = await getAuthenticatedUser(request);
    expect(result).toBeNull();
  });

  it("returns null when token is invalid (Supabase returns error)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Invalid token"),
    });

    const request = new Request("http://localhost/api/test", {
      headers: { Authorization: "Bearer invalid-token" },
    });
    const result = await getAuthenticatedUser(request);
    expect(result).toBeNull();
  });

  it("returns user when token is valid", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "user-123", email: "test@example.com" },
      },
      error: null,
    });

    const request = new Request("http://localhost/api/test", {
      headers: { Authorization: "Bearer valid-token" },
    });
    const result = await getAuthenticatedUser(request);
    expect(result).toEqual({ id: "user-123", email: "test@example.com" });
  });

  it("returns empty email when user has no email", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: "user-456", email: null },
      },
      error: null,
    });

    const request = new Request("http://localhost/api/test", {
      headers: { Authorization: "Bearer valid-token" },
    });
    const result = await getAuthenticatedUser(request);
    expect(result).toEqual({ id: "user-456", email: "" });
  });
});
