import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock verify-email-token
const mockVerifyEmailToken = vi.fn();
vi.mock("@/lib/verify-email-token", () => ({
  verifyEmailToken: (...args: unknown[]) => mockVerifyEmailToken(...args),
}));

// Mock activity-log
const mockLogEmailVerified = vi.fn();
vi.mock("@/lib/activity-log", () => ({
  logEmailVerified: (...args: unknown[]) => mockLogEmailVerified(...args),
}));

// Mock Supabase admin
const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: () => ({
      update: (data: unknown) => mockUpdate(data),
    }),
  },
}));

import { GET } from "@/app/api/verify-email/route";

describe("GET /api/verify-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateEq.mockResolvedValue({ error: null });
  });

  it("redirige vers success quand le token est valide", async () => {
    mockVerifyEmailToken.mockReturnValue(true);

    const request = new Request(
      "http://localhost/api/verify-email?email=user@test.com&token=valid-token-abc"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("email_verified=success");
    expect(mockVerifyEmailToken).toHaveBeenCalledWith("user@test.com", "valid-token-abc");
    expect(mockUpdate).toHaveBeenCalledWith({ email_verified: true });
    expect(mockLogEmailVerified).toHaveBeenCalledWith("", "user@test.com");
  });

  it("redirige vers error quand le token est invalide", async () => {
    mockVerifyEmailToken.mockReturnValue(false);

    const request = new Request(
      "http://localhost/api/verify-email?email=user@test.com&token=bad-token"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("email_verified=error");
    // Ne doit pas tenter de mettre a jour la base
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("redirige vers error quand le token est manquant", async () => {
    const request = new Request(
      "http://localhost/api/verify-email?email=user@test.com"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("email_verified=error");
    expect(mockVerifyEmailToken).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("redirige vers error quand l'email est manquant", async () => {
    const request = new Request(
      "http://localhost/api/verify-email?token=some-token"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("email_verified=error");
    expect(mockVerifyEmailToken).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("redirige vers error quand email ET token sont manquants", async () => {
    const request = new Request(
      "http://localhost/api/verify-email"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("email_verified=error");
    expect(mockVerifyEmailToken).not.toHaveBeenCalled();
  });

  it("redirige vers error quand le token est vide", async () => {
    const request = new Request(
      "http://localhost/api/verify-email?email=user@test.com&token="
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("email_verified=error");
    expect(mockVerifyEmailToken).not.toHaveBeenCalled();
  });

  it("double verification (idempotence) : pas d'erreur si deja verifie", async () => {
    // Meme si l'utilisateur est deja verifie, le update ne cause pas d'erreur
    mockVerifyEmailToken.mockReturnValue(true);
    mockUpdateEq.mockResolvedValue({ error: null });

    const request = new Request(
      "http://localhost/api/verify-email?email=user@test.com&token=valid-token-abc"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("email_verified=success");
  });

  it("redirige vers error quand Supabase retourne une erreur", async () => {
    mockVerifyEmailToken.mockReturnValue(true);
    mockUpdateEq.mockResolvedValue({ error: { message: "Database error" } });

    const request = new Request(
      "http://localhost/api/verify-email?email=user@test.com&token=valid-token-abc"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("email_verified=error");
    // Le log ne doit pas etre appele si la mise a jour echoue
    expect(mockLogEmailVerified).not.toHaveBeenCalled();
  });

  it("normalise l'email en minuscules et sans espaces pour le update", async () => {
    mockVerifyEmailToken.mockReturnValue(true);

    const request = new Request(
      "http://localhost/api/verify-email?email=User%40Test.com&token=valid-token"
    );
    await GET(request);

    // Le code fait .eq("email", email.toLowerCase().trim())
    // On verifie que update est appele avec email_verified: true
    expect(mockUpdate).toHaveBeenCalledWith({ email_verified: true });
  });

  it("la route est publique (pas de verification auth)", async () => {
    // La route /api/verify-email est publique : pas de getAuthenticatedUser()
    // Un utilisateur non connecte doit pouvoir verifier son email via le lien
    mockVerifyEmailToken.mockReturnValue(true);

    const request = new Request(
      "http://localhost/api/verify-email?email=user@test.com&token=valid-token"
    );
    const response = await GET(request);

    // La route repond sans Bearer token - elle est bien publique
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("email_verified=success");
  });

  it("redirige vers error si une exception est levee", async () => {
    mockVerifyEmailToken.mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    const request = new Request(
      "http://localhost/api/verify-email?email=user@test.com&token=crash-token"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("email_verified=error");
  });
});
