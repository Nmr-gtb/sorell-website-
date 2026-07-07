import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// /api/newsletters/draft : sauvegarde des modifications d'un brouillon
// (textes édités, articles réordonnés/supprimés, featured, objet).
// ---------------------------------------------------------------------------

// Mock auth
const mockGetAuthenticatedUser = vi.fn();
vi.mock("@/lib/auth", () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));

// Mock rate limit
const mockLimit = vi.fn();
vi.mock("@/lib/ratelimit", () => ({
  apiRateLimit: { limit: (...args: unknown[]) => mockLimit(...args) },
  draftSaveRateLimit: { limit: (...args: unknown[]) => mockLimit(...args) },
}));

// Supabase mock state
let mockNewsletterData: Record<string, unknown> | null = null;
let mockProfileData: Record<string, unknown> | null = null;
const mockNlUpdate = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockProfileData, error: null }),
            }),
          }),
        };
      }
      if (table === "newsletters") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: mockNewsletterData,
                    error: mockNewsletterData ? null : { message: "not found" },
                  }),
              }),
            }),
          }),
          update: (...args: unknown[]) => {
            mockNlUpdate(...args);
            return {
              eq: () => ({
                eq: () => ({
                  select: () => ({
                    single: () => Promise.resolve({ data: { id: "nl-123", status: "draft" }, error: null }),
                  }),
                }),
              }),
            };
          },
        };
      }
      return {
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      };
    },
  },
}));

import { POST } from "@/app/api/newsletters/draft/route";

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/newsletters/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer token" },
    body: JSON.stringify(body),
  });
}

function validContent(): Record<string, unknown> {
  return {
    editorial: "Un éditorial relu et corrigé.",
    key_figures: [{ value: "18,4%", label: "croissance du secteur", context: "Reuters" }],
    articles: [
      { tag: "TECH", title: "Titre Un", hook: "H1", content: "C1", source: "Reuters", url: "https://reuters.com/1", featured: true },
      { tag: "MARCHE", title: "Titre Deux", hook: "H2", content: "C2", source: "Les Echos", url: "https://lesechos.fr/2", featured: false },
    ],
  };
}

describe("POST /api/newsletters/draft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLimit.mockResolvedValue({ success: true });
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-biz", email: "biz@test.com" });
    mockNewsletterData = { id: "nl-123", status: "draft" };
    mockProfileData = { plan: "business" };
  });

  it("returns 401 if not authenticated", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);
    const response = await POST(makeRequest({ newsletterId: "nl-123", content: validContent() }));
    expect(response.status).toBe(401);
  });

  it("returns 403 for plans without editor access (free/pro)", async () => {
    mockProfileData = { plan: "pro" };
    const response = await POST(makeRequest({ newsletterId: "nl-123", content: validContent() }));
    expect(response.status).toBe(403);
    expect(mockNlUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 without newsletterId", async () => {
    const response = await POST(makeRequest({ content: validContent() }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when articles are missing or empty", async () => {
    const content = validContent();
    content.articles = [];
    const response = await POST(makeRequest({ newsletterId: "nl-123", content }));
    expect(response.status).toBe(400);
    expect(mockNlUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 when an article has no title", async () => {
    const content = validContent();
    (content.articles as Array<Record<string, unknown>>)[0].title = "   ";
    const response = await POST(makeRequest({ newsletterId: "nl-123", content }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when an article URL is not http(s)", async () => {
    const content = validContent();
    (content.articles as Array<Record<string, unknown>>)[0].url = "javascript:alert(1)";
    const response = await POST(makeRequest({ newsletterId: "nl-123", content }));
    expect(response.status).toBe(400);
  });

  it("returns 404 when the newsletter does not belong to the user", async () => {
    mockNewsletterData = null;
    const response = await POST(makeRequest({ newsletterId: "nl-999", content: validContent() }));
    expect(response.status).toBe(404);
  });

  it("returns 400 when the newsletter is already sent", async () => {
    mockNewsletterData = { id: "nl-123", status: "sent" };
    const response = await POST(makeRequest({ newsletterId: "nl-123", content: validContent() }));
    expect(response.status).toBe(400);
    expect(mockNlUpdate).not.toHaveBeenCalled();
  });

  it("saves the content and the subject of a draft", async () => {
    const response = await POST(makeRequest({
      newsletterId: "nl-123",
      content: validContent(),
      subject: "MARCHE - Un nouvel objet relu",
    }));
    expect(response.status).toBe(200);

    expect(mockNlUpdate).toHaveBeenCalledTimes(1);
    const payload = mockNlUpdate.mock.calls[0][0] as { content: { articles: Array<{ featured: boolean }>; editorial: string }; subject?: string };
    expect(payload.subject).toBe("MARCHE - Un nouvel objet relu");
    expect(payload.content.editorial).toBe("Un éditorial relu et corrigé.");
    expect(payload.content.articles).toHaveLength(2);
  });

  it("does not touch the subject when it is omitted", async () => {
    const response = await POST(makeRequest({ newsletterId: "nl-123", content: validContent() }));
    expect(response.status).toBe(200);

    const payload = mockNlUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.content).toBeDefined();
    expect("subject" in payload).toBe(false);
  });

  it("does not overwrite the subject with an empty string", async () => {
    const response = await POST(makeRequest({ newsletterId: "nl-123", content: validContent(), subject: "   " }));
    expect(response.status).toBe(200);

    const payload = mockNlUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect("subject" in payload).toBe(false);
  });

  it("normalizes the featured flag: exactly one featured article after save", async () => {
    const content = validContent();
    // Deux articles marqués "à la une" : seule la première occurrence doit rester
    (content.articles as Array<Record<string, unknown>>)[0].featured = true;
    (content.articles as Array<Record<string, unknown>>)[1].featured = true;

    const response = await POST(makeRequest({ newsletterId: "nl-123", content }));
    expect(response.status).toBe(200);

    const payload = mockNlUpdate.mock.calls[0][0] as { content: { articles: Array<{ featured: boolean }> } };
    const featuredCount = payload.content.articles.filter((a) => a.featured).length;
    expect(featuredCount).toBe(1);
    expect(payload.content.articles[0].featured).toBe(true);
  });

  it("promotes the first article when none is featured", async () => {
    const content = validContent();
    (content.articles as Array<Record<string, unknown>>)[0].featured = false;
    (content.articles as Array<Record<string, unknown>>)[1].featured = false;

    const response = await POST(makeRequest({ newsletterId: "nl-123", content }));
    expect(response.status).toBe(200);

    const payload = mockNlUpdate.mock.calls[0][0] as { content: { articles: Array<{ featured: boolean }> } };
    expect(payload.content.articles[0].featured).toBe(true);
    expect(payload.content.articles[1].featured).toBe(false);
  });

  it("returns 429 when rate limited", async () => {
    mockLimit.mockResolvedValue({ success: false });
    const response = await POST(makeRequest({ newsletterId: "nl-123", content: validContent() }));
    expect(response.status).toBe(429);
  });
});
