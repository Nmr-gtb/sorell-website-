import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// /api/generate/article : régénération ciblée d'un bloc du brouillon
// (un article, l'édito ou les chiffres clés) — mode éditeur.
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
let mockProfileData: Record<string, unknown> | null = null;
let mockNewsletterData: Record<string, unknown> | null = null;
let mockConfigData: Record<string, unknown> | null = null;
let mockRecentData: Array<Record<string, unknown>> = [];
const mockNlUpdate = vi.fn();
let mockUpdatedNewsletter: Record<string, unknown> | null = null;

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
      if (table === "newsletter_config") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockConfigData, error: null }),
            }),
          }),
        };
      }
      if (table === "newsletters") {
        return {
          select: (...args: unknown[]) => {
            // select("content") → requête anti-doublon avec .neq()
            if (args[0] === "content") {
              return {
                eq: () => ({
                  neq: () => ({
                    order: () => ({
                      limit: () => Promise.resolve({ data: mockRecentData, error: null }),
                    }),
                  }),
                }),
              };
            }
            // select("id, user_id, subject, content, status") → la newsletter cible
            return {
              eq: () => ({
                eq: () => ({
                  single: () =>
                    Promise.resolve({
                      data: mockNewsletterData,
                      error: mockNewsletterData ? null : { message: "not found" },
                    }),
                }),
              }),
            };
          },
          update: (...args: unknown[]) => {
            mockNlUpdate(...args);
            return {
              eq: () => ({
                eq: () => ({
                  select: () => ({
                    single: () => Promise.resolve({ data: mockUpdatedNewsletter, error: null }),
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

// Mock Anthropic
vi.mock("@anthropic-ai/sdk", () => {
  const mockCreate = vi.fn();
  return {
    default: class {
      messages = { create: mockCreate };
    },
    __mockCreate: mockCreate,
  };
});

import { POST } from "@/app/api/generate/article/route";
import * as anthropicModule from "@anthropic-ai/sdk";

const mockCreate = (anthropicModule as unknown as { __mockCreate: ReturnType<typeof vi.fn> }).__mockCreate;

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/generate/article", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer token" },
    body: JSON.stringify(body),
  });
}

function makeDraftContent() {
  return {
    editorial: "Éditorial initial",
    key_figures: [{ value: "12%", label: "hausse", context: "Les Echos" }],
    articles: [
      { tag: "TECH", title: "Article Un", hook: "H1", content: "C1", source: "Reuters", url: "https://reuters.com/1", featured: true },
      { tag: "MARCHE", title: "Article Deux", hook: "H2", content: "C2", source: "Les Echos", url: "https://lesechos.fr/2", featured: false },
      { tag: "IA", title: "Article Trois", hook: "H3", content: "C3", source: "TechCrunch", url: "https://techcrunch.com/3", featured: false },
    ],
  };
}

describe("POST /api/generate/article", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";
    mockLimit.mockResolvedValue({ success: true });
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-biz", email: "biz@test.com" });
    mockProfileData = { plan: "business" };
    mockNewsletterData = {
      id: "nl-123",
      user_id: "user-biz",
      subject: "TECH - Article Un",
      content: makeDraftContent(),
      status: "draft",
    };
    mockConfigData = {
      topics: [{ label: "Tech", enabled: true }, { label: "Finance", enabled: false }],
      sources: ["Les Echos"],
      custom_brief: "Actus B2B",
    };
    mockRecentData = [];
    mockUpdatedNewsletter = { id: "nl-123", subject: "TECH - Article Un", status: "draft" };
  });

  it("returns 401 if not authenticated", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);
    const response = await POST(makeRequest({ newsletterId: "nl-123", target: "article", articleIndex: 1 }));
    expect(response.status).toBe(401);
  });

  it("returns 403 for plans without editor access (free/pro)", async () => {
    mockProfileData = { plan: "pro" };
    const response = await POST(makeRequest({ newsletterId: "nl-123", target: "article", articleIndex: 1 }));
    expect(response.status).toBe(403);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 when the article index is out of bounds", async () => {
    const response = await POST(makeRequest({ newsletterId: "nl-123", target: "article", articleIndex: 12 }));
    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 when the newsletter is not a draft", async () => {
    mockNewsletterData = { ...mockNewsletterData!, status: "sent" };
    const response = await POST(makeRequest({ newsletterId: "nl-123", target: "article", articleIndex: 1 }));
    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("replaces exactly one article, keeps the rest and excludes existing titles from the prompt", async () => {
    const today = new Date().toISOString().substring(0, 10);
    mockCreate.mockResolvedValue({
      content: [{
        type: "text",
        text: JSON.stringify({
          tag: "RSE",
          title: "Article Régénéré",
          hook: "Nouvelle accroche",
          content: "Nouveau contenu factuel.",
          source: "La Tribune",
          url: "https://latribune.fr/nouveau",
          published_at: today,
        }),
      }],
    });

    const response = await POST(makeRequest({ newsletterId: "nl-123", target: "article", articleIndex: 1 }));
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.articles).toHaveLength(3);
    expect(data.articles[1].title).toBe("Article Régénéré");
    expect(data.articles[1].featured).toBe(false);
    // Les autres articles ne bougent pas
    expect(data.articles[0].title).toBe("Article Un");
    expect(data.articles[2].title).toBe("Article Trois");
    // L'objet ne change pas (l'article remplacé n'était pas à la une)
    expect(data.subject).toBe("TECH - Article Un");

    // Anti-doublon : le prompt exclut les titres des autres articles
    const prompt = mockCreate.mock.calls[0][0].messages[0].content as string;
    expect(prompt).toContain("Article Un");
    expect(prompt).toContain("Article Trois");
    expect(prompt).not.toContain("Article Deux");
  });

  it("refreshes the subject when the featured article is regenerated", async () => {
    const today = new Date().toISOString().substring(0, 10);
    mockCreate.mockResolvedValue({
      content: [{
        type: "text",
        text: JSON.stringify({
          tag: "ENERGIE",
          title: "Nouvelle Une",
          hook: "Accroche",
          content: "Contenu.",
          source: "Reuters",
          url: "https://reuters.com/une",
          published_at: today,
        }),
      }],
    });

    const response = await POST(makeRequest({ newsletterId: "nl-123", target: "article", articleIndex: 0 }));
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.articles[0].title).toBe("Nouvelle Une");
    expect(data.articles[0].featured).toBe(true);
    expect(data.subject).toBe("ENERGIE - Nouvelle Une");
  });

  it("returns 422 when the regenerated article is too old (freshness filter)", async () => {
    mockCreate.mockResolvedValue({
      content: [{
        type: "text",
        text: JSON.stringify({
          tag: "TECH",
          title: "Article Périmé",
          hook: "Accroche",
          content: "Contenu.",
          source: "Reuters",
          url: "https://reuters.com/vieux",
          published_at: "2020-01-15",
        }),
      }],
    });

    const response = await POST(makeRequest({ newsletterId: "nl-123", target: "article", articleIndex: 1 }));
    expect(response.status).toBe(422);
    expect(mockNlUpdate).not.toHaveBeenCalled();
  });

  it("regenerates the editorial without touching the articles", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "Nouvel éditorial de la semaine, tendance IA en tête." }],
    });

    const response = await POST(makeRequest({ newsletterId: "nl-123", target: "editorial" }));
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.editorial).toBe("Nouvel éditorial de la semaine, tendance IA en tête.");
    expect(data.articles).toHaveLength(3);
    expect(data.articles[0].title).toBe("Article Un");
  });

  it("regenerates the key figures from the current articles", async () => {
    mockCreate.mockResolvedValue({
      content: [{
        type: "text",
        text: JSON.stringify([
          { value: "47,2%", label: "part de marché", context: "Reuters" },
          { value: "3,4 Md€", label: "levée de fonds", context: "Les Echos" },
        ]),
      }],
    });

    const response = await POST(makeRequest({ newsletterId: "nl-123", target: "key_figures" }));
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.keyFigures).toHaveLength(2);
    expect(data.keyFigures[0].value).toBe("47,2%");
    expect(data.articles).toHaveLength(3);
  });

  it("returns 429 when rate limited", async () => {
    mockLimit.mockResolvedValue({ success: false });
    const response = await POST(makeRequest({ newsletterId: "nl-123", target: "article", articleIndex: 1 }));
    expect(response.status).toBe(429);
  });
});
