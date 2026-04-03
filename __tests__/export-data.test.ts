import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
const mockGetAuthenticatedUser = vi.fn();
vi.mock("@/lib/auth", () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));

// Mock supabase-admin
const mockFrom = vi.fn();
vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { GET } from "@/app/api/export-data/route";

function buildRequest(options?: { auth?: boolean }) {
  const headers: Record<string, string> = {};
  if (options?.auth) {
    headers["Authorization"] = "Bearer test-token";
  }
  return new Request("http://localhost/api/export-data", { method: "GET", headers });
}

describe("GET /api/export-data", () => {
  const mockProfile = { id: "user-123", email: "test@example.com", full_name: "Test User", plan: "pro", created_at: "2026-01-01" };
  const mockConfig = { topics: ["tech"], custom_topics: [], custom_brief: "Mon brief", sources: [], recipients: ["test@example.com"], frequency: "weekly", send_day: "monday", send_hour: 9 };
  const mockRecipients = [{ email: "team@example.com", name: "Team", created_at: "2026-02-01" }];
  const mockNewsletters = [{ id: "nl-1", subject: "Newsletter 1", content: [], created_at: "2026-03-01", sent_at: "2026-03-01" }];
  const mockLifecycle = [{ email_type: "welcome", sent_at: "2026-01-01" }];

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });

    // Mock supabase chain for each table
    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: mockProfile }),
            }),
          }),
        };
      }
      if (table === "newsletter_config") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: mockConfig }),
            }),
          }),
        };
      }
      if (table === "recipients") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockRecipients }),
          }),
        };
      }
      if (table === "newsletters") {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: mockNewsletters }),
            }),
          }),
        };
      }
      if (table === "lifecycle_emails") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockLifecycle }),
          }),
        };
      }
      return { select: () => ({ eq: () => Promise.resolve({ data: null }) }) };
    });
  });

  it("retourne 401 si non authentifie", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);
    const request = buildRequest();
    const response = await GET(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toContain("Non autoris");
  });

  it("retourne 200 avec les donnees utilisateur completes", async () => {
    const request = buildRequest({ auth: true });
    const response = await GET(request);
    expect(response.status).toBe(200);

    // Verify Content-Disposition header for file download
    const contentDisposition = response.headers.get("Content-Disposition");
    expect(contentDisposition).toContain("attachment");
    expect(contentDisposition).toContain("sorell-export-");

    const data = await response.json();
    expect(data.exported_at).toBeDefined();
    expect(data.profile).toEqual(mockProfile);
    expect(data.newsletter_config).toEqual(mockConfig);
    expect(data.recipients).toEqual(mockRecipients);
    expect(data.newsletters).toEqual(mockNewsletters);
    expect(data.lifecycle_emails).toEqual(mockLifecycle);
  });

  it("retourne 200 avec des valeurs par defaut si les tables sont vides", async () => {
    mockFrom.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null }),
          order: () => Promise.resolve({ data: null }),
        }),
      }),
    }));

    const request = buildRequest({ auth: true });
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.profile).toBeNull();
    expect(data.newsletter_config).toBeNull();
    expect(data.recipients).toEqual([]);
    expect(data.newsletters).toEqual([]);
    expect(data.lifecycle_emails).toEqual([]);
  });

  it("retourne 500 en cas d'erreur serveur", async () => {
    mockGetAuthenticatedUser.mockRejectedValue(new Error("DB crash"));

    const request = buildRequest({ auth: true });
    const response = await GET(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain("erreur est survenue");
  });
});
