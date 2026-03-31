import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
const mockGetAuthenticatedUser = vi.fn();
vi.mock("@/lib/auth", () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));

// Mock rate limit
const mockLimit = vi.fn();
vi.mock("@/lib/ratelimit", () => ({
  apiRateLimit: { limit: (...args: unknown[]) => mockLimit(...args) },
}));

// Mock Supabase admin
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpsert = vi.fn();
const mockOrder = vi.fn();
const mockLimitDb = vi.fn();
const mockGte = vi.fn();
const mockHead = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { plan: "pro" }, error: null }),
            }),
          }),
        };
      }
      if (table === "newsletters") {
        return {
          select: (...args: unknown[]) => {
            // count query (head: true)
            if (args.length > 1) {
              return {
                eq: () => ({
                  eq: () => ({
                    gte: () => Promise.resolve({ count: 0 }),
                  }),
                }),
              };
            }
            // recent newsletters query
            return {
              eq: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: [] }),
                }),
              }),
            };
          },
          insert: () => ({
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    id: "nl-123",
                    user_id: "user-123",
                    subject: "Test Newsletter",
                    content: {},
                    status: "draft",
                  },
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === "recipients") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [{ email: "user@test.com" }] }),
          }),
          upsert: () => Promise.resolve({ error: null }),
        };
      }
      if (table === "newsletter_config") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    topics: [{ label: "Tech", enabled: true }],
                    sources: [],
                    custom_brief: "",
                  },
                  error: null,
                }),
            }),
          }),
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

import { POST } from "@/app/api/generate/route";
import * as anthropicModule from "@anthropic-ai/sdk";

const mockCreate = (anthropicModule as unknown as { __mockCreate: ReturnType<typeof vi.fn> }).__mockCreate;

describe("POST /api/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
    mockLimit.mockResolvedValue({ success: true });
  });

  it("returns 401 if not authenticated", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topics: [{ label: "Tech", enabled: true }] }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("returns 403 if userId mismatch", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });

    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({
        userId: "user-456",
        topics: [{ label: "Tech", enabled: true }],
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it("returns 429 if rate limited", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockLimit.mockResolvedValue({ success: false });

    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({
        userId: "user-123",
        topics: [{ label: "Tech", enabled: true }],
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toContain("Trop de requetes");
  });

  it("returns newsletter on successful generation", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockLimit.mockResolvedValue({ success: true });

    const mockContent = JSON.stringify({
      editorial: "Cette semaine en tech...",
      key_figures: [{ value: "42%", label: "croissance", context: "source" }],
      articles: [
        {
          tag: "TECH",
          title: "Test Article",
          hook: "A hook",
          content: "Content here.",
          source: "TechCrunch",
          url: "https://techcrunch.com/article",
          featured: true,
        },
      ],
    });

    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: mockContent }],
    });

    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({
        userId: "user-123",
        topics: [{ label: "Tech", enabled: true }],
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.newsletter).toBeDefined();
    expect(data.newsletter.id).toBe("nl-123");
    expect(data.articles).toBeDefined();
    expect(data.editorial).toBeDefined();
  });
});
