import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock rate limit
const mockLimit = vi.fn();
vi.mock("@/lib/ratelimit", () => ({
  emailRateLimit: { limit: (...args: unknown[]) => mockLimit(...args) },
}));

// Mock Supabase admin
const mockCacheSingle = vi.fn();
const mockUpsert = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === "demo_cache") {
        return {
          select: () => ({
            eq: () => ({
              single: () => mockCacheSingle(),
            }),
          }),
          upsert: (...args: unknown[]) => mockUpsert(...args),
        };
      }
      return {};
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

import { GET } from "@/app/api/demo/route";
import * as anthropicModule from "@anthropic-ai/sdk";

const mockCreate = (anthropicModule as unknown as { __mockCreate: ReturnType<typeof vi.fn> }).__mockCreate;

describe("GET /api/demo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";
    mockLimit.mockResolvedValue({ success: true });
  });

  it("returns 400 for invalid sector", async () => {
    const request = new Request("http://localhost/api/demo?sector=invalid_sector");
    const response = await GET(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Secteur invalide");
  });

  it("returns 429 when rate limit is exceeded", async () => {
    mockLimit.mockResolvedValue({ success: false });

    const request = new Request("http://localhost/api/demo?sector=tech");
    const response = await GET(request);
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toContain("Trop de requetes");
  });

  it("proceeds when rate limiter is down (fail-open)", async () => {
    mockLimit.mockRejectedValue(new Error("Redis connection error"));
    // No cache, so it will call Claude API
    mockCacheSingle.mockResolvedValue({ data: null });
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify([{ tag: "TECH", title: "Article", summary: "Summary", source: "Source", url: "https://example.com", image_url: null, featured: true }]) }],
    });

    const request = new Request("http://localhost/api/demo?sector=tech");
    const response = await GET(request);
    expect(response.status).toBe(200);
  });

  it("returns cached articles when cache is fresh", async () => {
    const cachedArticles = [
      { tag: "TECH", title: "Cached Article", summary: "Cached summary", source: "TechCrunch", url: "https://example.com", featured: true },
    ];
    const generatedAt = new Date().toISOString();

    mockCacheSingle.mockResolvedValue({
      data: {
        sector: "tech_fr",
        content: cachedArticles,
        generated_at: generatedAt,
      },
    });

    const request = new Request("http://localhost/api/demo?sector=tech");
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.fromCache).toBe(true);
    expect(data.articles).toEqual(cachedArticles);
    // Should NOT call Claude API
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("calls Claude API when no cache exists and returns articles", async () => {
    // No cache
    mockCacheSingle.mockResolvedValue({ data: null });

    const articlesJson = JSON.stringify([
      { tag: "TECH", title: "New Article", summary: "Summary", source: "Reuters", url: "https://reuters.com/article", image_url: null, featured: true },
      { tag: "IA", title: "AI News", summary: "AI summary", source: "TechCrunch", url: "https://techcrunch.com/ai", image_url: null, featured: false },
    ]);

    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: articlesJson }],
    });

    const request = new Request("http://localhost/api/demo?sector=tech");
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.fromCache).toBe(false);
    expect(data.articles).toBeDefined();
    expect(data.articles.length).toBe(2);
    expect(data.articles[0].title).toBe("New Article");
    // Should have called Claude
    expect(mockCreate).toHaveBeenCalledTimes(1);
    // Should have upserted to cache
    expect(mockUpsert).toHaveBeenCalled();
  });
});
