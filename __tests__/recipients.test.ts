import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetAuthenticatedUser = vi.fn();
vi.mock("@/lib/auth", () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));

const mockUpsert = vi.fn();
vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: () => ({
      upsert: (...args: unknown[]) => mockUpsert(...args),
    }),
  },
}));

import { POST } from "@/app/api/recipients/route";

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/recipients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/recipients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockUpsert.mockResolvedValue({ error: null });
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);
    const response = await POST(makeRequest({ email: "contact@acme.fr", name: "Jean" }));
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Non autorise");
  });

  it("returns 400 when email is missing", async () => {
    const response = await POST(makeRequest({ name: "Jean" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Email invalide");
  });

  it("returns 400 when email is empty string", async () => {
    const response = await POST(makeRequest({ email: "", name: "Jean" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Email invalide");
  });

  it("returns 400 when email is invalid format", async () => {
    const response = await POST(makeRequest({ email: "not-an-email", name: "Jean" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Email invalide");
  });

  it("returns 400 when email has no domain", async () => {
    const response = await POST(makeRequest({ email: "user@", name: "Jean" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Email invalide");
  });

  it("adds a valid recipient successfully", async () => {
    const response = await POST(makeRequest({ email: "contact@acme.fr", name: "Jean Dupont" }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it("calls upsert with correct parameters", async () => {
    await POST(makeRequest({ email: "Contact@Acme.FR", name: "Jean Dupont" }));
    expect(mockUpsert).toHaveBeenCalledWith(
      { user_id: "user-123", email: "contact@acme.fr", name: "Jean Dupont" },
      { onConflict: "user_id,email" }
    );
  });

  it("normalizes email to lowercase and trims whitespace", async () => {
    await POST(makeRequest({ email: "  TEST@Example.COM  ", name: "Test" }));
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ email: "test@example.com" }),
      expect.objectContaining({ onConflict: "user_id,email" })
    );
  });

  it("handles name being empty string", async () => {
    const response = await POST(makeRequest({ email: "contact@acme.fr", name: "" }));
    expect(response.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ name: "" }),
      expect.objectContaining({})
    );
  });

  it("handles missing name field", async () => {
    const response = await POST(makeRequest({ email: "contact@acme.fr" }));
    expect(response.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ name: "" }),
      expect.objectContaining({})
    );
  });

  it("truncates email to 320 characters", async () => {
    const longEmail = "a".repeat(300) + "@example.com";
    await POST(makeRequest({ email: longEmail, name: "Test" }));
    const callArgs = mockUpsert.mock.calls[0] as [Record<string, string>, Record<string, string>];
    expect(callArgs[0].email.length).toBeLessThanOrEqual(320);
  });

  it("truncates name to 200 characters", async () => {
    const longName = "A".repeat(250);
    await POST(makeRequest({ email: "contact@acme.fr", name: longName }));
    const callArgs = mockUpsert.mock.calls[0] as [Record<string, string>, Record<string, string>];
    expect(callArgs[0].name.length).toBeLessThanOrEqual(200);
  });

  it("returns 500 when supabase upsert fails", async () => {
    mockUpsert.mockResolvedValue({ error: { message: "DB error" } });
    const response = await POST(makeRequest({ email: "contact@acme.fr", name: "Jean" }));
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Erreur lors de l'ajout");
  });

  it("returns 500 with generic message on unexpected error", async () => {
    mockUpsert.mockRejectedValue(new Error("Unexpected"));
    const response = await POST(makeRequest({ email: "contact@acme.fr", name: "Jean" }));
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Une erreur est survenue");
  });

  it("handles duplicate email via upsert (no error)", async () => {
    mockUpsert.mockResolvedValue({ error: null });
    const response = await POST(makeRequest({ email: "contact@acme.fr", name: "Jean V2" }));
    expect(response.status).toBe(200);
    expect(data(response)).resolves.toMatchObject({ success: true });
  });
});

async function data(response: Response): Promise<Record<string, unknown>> {
  return response.json() as Promise<Record<string, unknown>>;
}
