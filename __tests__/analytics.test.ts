import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
const mockGetAuthenticatedUser = vi.fn();
vi.mock("@/lib/auth", () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));

// Mock supabase-admin
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockIn = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { GET } from "@/app/api/analytics/route";

function buildRequest(params?: { userId?: string; auth?: boolean }) {
  const url = new URL("http://localhost/api/analytics");
  if (params?.userId) url.searchParams.set("userId", params.userId);
  const headers: Record<string, string> = {};
  if (params?.auth) {
    headers["Authorization"] = "Bearer test-token";
  }
  return new Request(url.toString(), { method: "GET", headers });
}

describe("GET /api/analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });

    // Default chain: from().select().eq().order() or from().select().eq()
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEq, order: mockOrder, in: mockIn });
    mockOrder.mockResolvedValue({ data: [] });
    mockIn.mockResolvedValue({ data: [] });
  });

  it("retourne 401 si non authentifie", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);
    const request = buildRequest({ userId: "user-123" });
    const response = await GET(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toContain("Non autorise");
  });

  it("retourne 403 si userId ne correspond pas a l'utilisateur authentifie", async () => {
    const request = buildRequest({ userId: "other-user", auth: true });
    const response = await GET(request);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain("Non autorise");
  });

  it("retourne 200 avec des analytics vides si aucune newsletter envoyee", async () => {
    mockOrder.mockResolvedValue({ data: [] });

    const request = buildRequest({ userId: "user-123", auth: true });
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.openRate).toBe(0);
    expect(data.clickRate).toBe(0);
    expect(data.totalSent).toBe(0);
    expect(data.totalOpens).toBe(0);
    expect(data.totalClicks).toBe(0);
    expect(data.activeRecipients).toBe(0);
    expect(data.newsletters).toEqual([]);
    expect(data.topArticles).toEqual([]);
    expect(data.weeklyData).toEqual([]);
  });

  it("retourne 200 avec des analytics valides si des newsletters existent", async () => {
    const newsletters = [
      {
        id: "nl-1",
        user_id: "user-123",
        subject: "Newsletter 1",
        content: [{ title: "Article 1" }, { title: "Article 2" }],
        sent_at: "2026-03-01T10:00:00Z",
        recipient_count: 3,
        status: "sent",
      },
    ];

    const recipients = [{ id: "r-1" }, { id: "r-2" }, { id: "r-3" }];

    const events = [
      { event_type: "open", newsletter_id: "nl-1", metadata: {} },
      { event_type: "open", newsletter_id: "nl-1", metadata: {} },
      { event_type: "click", newsletter_id: "nl-1", metadata: { article: "Article 1" } },
    ];

    // Chain for newsletters: from("newsletters").select("*").eq("user_id", ...).eq("status", "sent").order(...)
    let eqCallCount = 0;
    mockEq.mockImplementation(() => {
      eqCallCount++;
      // The chain is .eq("user_id").eq("status").order()
      // We need eq to return something with eq and order
      return {
        eq: mockEq,
        order: mockOrder,
        in: mockIn,
      };
    });

    let fromCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      fromCallCount++;
      if (table === "newsletters") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: newsletters }),
              }),
            }),
          }),
        };
      }
      if (table === "recipients") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: recipients }),
          }),
        };
      }
      if (table === "newsletter_events") {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: events }),
          }),
        };
      }
      return { select: mockSelect };
    });

    const request = buildRequest({ userId: "user-123", auth: true });
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.totalSent).toBe(1);
    expect(data.totalOpens).toBe(2);
    expect(data.totalClicks).toBe(1);
    expect(data.activeRecipients).toBe(3);
    expect(data.openRate).toBe(67); // 2/3 rounded
    expect(data.clickRate).toBe(33); // 1/3 rounded
    expect(data.topArticles).toEqual([{ title: "Article 1", clicks: 1 }]);
    expect(data.newsletters).toHaveLength(1);
    expect(data.newsletters[0].subject).toBe("Newsletter 1");
  });

  it("retourne 500 en cas d'erreur serveur", async () => {
    mockGetAuthenticatedUser.mockRejectedValue(new Error("DB crash"));

    const request = buildRequest({ userId: "user-123", auth: true });
    const response = await GET(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain("erreur est survenue");
  });
});
