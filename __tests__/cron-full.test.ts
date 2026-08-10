import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase admin
const mockConfigsSelect = vi.fn();
const mockProfilesSelect = vi.fn();
const mockNewslettersCountSelect = vi.fn();
const mockNewslettersMonthlySentSelect = vi.fn();
const mockNewslettersRecentSelect = vi.fn();
const mockNewslettersInsert = vi.fn();
const mockNewslettersUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
const mockConfigUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
const mockRecipientsSelect = vi.fn();
const mockGetUserById = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === "newsletter_config") {
        return {
          select: () => ({
            not: () => ({ order: () => mockConfigsSelect() }),
          }),
          update: (...args: unknown[]) => mockConfigUpdate(...args),
        };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            in: () => mockProfilesSelect(),
          }),
        };
      }
      if (table === "newsletters") {
        return {
          select: (...args: unknown[]) => {
            // count query (2 args: "id", { count, head })
            if (args.length > 1) {
              return {
                eq: () => ({
                  eq: () => ({
                    gte: () => mockNewslettersCountSelect(),
                  }),
                }),
              };
            }
            // queries with .in() (select("user_id") or select("user_id, content"))
            if (typeof args[0] === "string" && (args[0] as string).startsWith("user_id")) {
              return {
                in: () => ({
                  eq: () => ({
                    gte: () => mockNewslettersMonthlySentSelect(),
                  }),
                  order: () => ({
                    limit: () => mockNewslettersRecentSelect(),
                  }),
                }),
              };
            }
            // recent newsletters query (legacy, without .in())
            return {
              eq: () => ({
                order: () => ({
                  limit: () => mockNewslettersRecentSelect(),
                }),
              }),
            };
          },
          insert: () => ({
            select: () => ({
              single: () => mockNewslettersInsert(),
            }),
          }),
          update: (...args: unknown[]) => mockNewslettersUpdate(...args),
        };
      }
      if (table === "recipients") {
        return {
          select: () => ({
            eq: () => mockRecipientsSelect(),
          }),
          upsert: () => Promise.resolve({ error: null }),
        };
      }
      return {
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      };
    },
    auth: {
      admin: {
        getUserById: (...args: unknown[]) => mockGetUserById(...args),
      },
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

// Mock Resend — l'envoi passe par l'API batch (lib/send-newsletter-batch).
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: vi.fn().mockResolvedValue({ id: "email-123" }) };
    batch = {
      send: vi.fn().mockImplementation((payload: Array<{ to: string }>) =>
        Promise.resolve({
          data: { data: payload.map((_, i) => ({ id: `email-${i}` })), errors: [] },
          error: null,
        })
      ),
    };
  },
}));

// Mock email template
vi.mock("@/lib/email-template", () => ({
  buildNewsletterHtml: async () => "<html>Newsletter</html>",
}));

import { GET } from "@/app/api/cron/route";
import * as anthropicModule from "@anthropic-ai/sdk";

const mockCreate = (anthropicModule as unknown as { __mockCreate: ReturnType<typeof vi.fn> }).__mockCreate;

// Helper to create a config matching "now" in France timezone
function makeConfigForNow(): Record<string, unknown> {
  const now = new Date();
  const franceTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return {
    user_id: "user-123",
    topics: [{ label: "Tech", enabled: true }],
    sources: [],
    custom_brief: "",
    frequency: "weekly",
    send_day: dayNames[franceTime.getDay()],
    send_hour: franceTime.getHours(),
    last_sent_at: null,
    recipients: ["user@test.com"],
    brand_color: "#005058",
    custom_logo_url: null,
    text_color: "#111827",
    bg_color: "#FFFFFF",
    body_text_color: "#4B5563",
  };
}

describe("GET /api/cron", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    process.env.ANTHROPIC_API_KEY = "test-key";
    process.env.RESEND_API_KEY = "test-resend-key";
  });

  it("returns 401 if authorization header is missing", async () => {
    const request = new Request("http://localhost/api/cron");
    const response = await GET(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 401 if authorization secret is wrong", async () => {
    const request = new Request("http://localhost/api/cron", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    const response = await GET(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("generates and sends newsletter for user with valid config and due schedule", async () => {
    const config = makeConfigForNow();

    mockConfigsSelect.mockResolvedValue({
      data: [config],
      error: null,
    });

    mockProfilesSelect.mockResolvedValue({
      data: [{ id: "user-123", plan: "pro", email_verified: true }],
    });

    // Monthly sent data (batch query for free limit)
    mockNewslettersMonthlySentSelect.mockResolvedValue({ data: [] });

    // Newsletter count this month: 0 (under limit)
    mockNewslettersCountSelect.mockResolvedValue({ count: 0 });

    // No recent newsletters (anti-doublon)
    mockNewslettersRecentSelect.mockResolvedValue({ data: [] });

    // Newsletter insert
    mockNewslettersInsert.mockResolvedValue({
      data: { id: "nl-456", user_id: "user-123", subject: "Test", content: {}, status: "draft" },
      error: null,
    });

    // Recipients
    mockRecipientsSelect.mockResolvedValue({
      data: [{ email: "user@test.com", name: "" }],
    });

    // Claude response
    const today = new Date().toISOString().substring(0, 10);
    const claudeResponse = JSON.stringify({
      editorial: "This week in tech...",
      key_figures: [{ value: "42%", label: "growth", context: "source" }],
      articles: [
        { tag: "TECH", title: "Test Article A", hook: "A hook", content: "Content.", source: "Reuters", url: "https://reuters.com/a", published_at: today, featured: true },
        { tag: "TECH", title: "Test Article B", hook: "A hook", content: "Content.", source: "Les Echos", url: "https://lesechos.fr/b", published_at: today, featured: false },
        { tag: "TECH", title: "Test Article C", hook: "A hook", content: "Content.", source: "TechCrunch", url: "https://techcrunch.com/c", published_at: today, featured: false },
      ],
    });

    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: claudeResponse }],
    });

    const request = new Request("http://localhost/api/cron", {
      headers: { authorization: `Bearer test-cron-secret` },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.results).toBeDefined();
    expect(data.results.length).toBe(1);
    expect(data.results[0].status).toBe("sent");
    expect(data.results[0].userId).toBe("user-123");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("skips free user when monthly newsletter limit is reached", async () => {
    const config = makeConfigForNow();
    config.user_id = "user-free";

    mockConfigsSelect.mockResolvedValue({
      data: [config],
      error: null,
    });

    mockProfilesSelect.mockResolvedValue({
      data: [{ id: "user-free", plan: "free", email_verified: true }],
    });

    // Monthly sent data (batch query for free limit)
    mockNewslettersMonthlySentSelect.mockResolvedValue({ data: [{ user_id: "user-free" }, { user_id: "user-free" }] });

    // Free plan limit = 2, already sent 2 this month
    mockNewslettersCountSelect.mockResolvedValue({ count: 2 });

    const request = new Request("http://localhost/api/cron", {
      headers: { authorization: `Bearer test-cron-secret` },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    // The user should have been skipped (no results for this user)
    expect(data.results.length).toBe(0);
    // Claude should NOT have been called
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns generic error message when Claude generation fails (no technical error exposed)", async () => {
    const config = makeConfigForNow();

    mockConfigsSelect.mockResolvedValue({
      data: [config],
      error: null,
    });

    mockProfilesSelect.mockResolvedValue({
      data: [{ id: "user-123", plan: "pro", email_verified: true }],
    });

    mockNewslettersMonthlySentSelect.mockResolvedValue({ data: [] });
    mockNewslettersCountSelect.mockResolvedValue({ count: 0 });
    mockNewslettersRecentSelect.mockResolvedValue({ data: [] });

    // Claude throws an error
    mockCreate.mockRejectedValue(new Error("Anthropic API rate limit exceeded: 429 Too Many Requests"));

    const request = new Request("http://localhost/api/cron", {
      headers: { authorization: `Bearer test-cron-secret` },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.results.length).toBe(1);
    expect(data.results[0].status).toBe("error");
    // CRITICAL: The error message must be generic, NOT exposing the technical Anthropic error
    expect(data.results[0].error).toBe("Erreur lors du traitement");
    expect(data.results[0].error).not.toContain("Anthropic");
    expect(data.results[0].error).not.toContain("429");
    expect(data.results[0].error).not.toContain("rate limit");
  });

  // --- Rattrapage : les jours d'affluence (1er/15), une invocation de 60s ne
  // sert pas tout le monde. Un utilisateur non servi à son heure doit être
  // rattrapé par les invocations des 3 heures suivantes. ---

  function setupHappyPath(config: Record<string, unknown>) {
    mockConfigsSelect.mockResolvedValue({ data: [config], error: null });
    mockProfilesSelect.mockResolvedValue({
      data: [{ id: "user-123", plan: "pro", email_verified: true }],
    });
    mockNewslettersMonthlySentSelect.mockResolvedValue({ data: [] });
    mockNewslettersCountSelect.mockResolvedValue({ count: 0 });
    mockNewslettersRecentSelect.mockResolvedValue({ data: [] });
    mockNewslettersInsert.mockResolvedValue({
      data: { id: "nl-456", user_id: "user-123", subject: "Test", content: {}, status: "draft" },
      error: null,
    });
    mockRecipientsSelect.mockResolvedValue({ data: [{ email: "user@test.com", name: "" }] });
    const today = new Date().toISOString().substring(0, 10);
    mockCreate.mockResolvedValue({
      content: [{
        type: "text",
        text: JSON.stringify({
          editorial: "Édito",
          key_figures: [],
          articles: [
            { tag: "TECH", title: "Article A", hook: "H", content: "C", source: "Reuters", url: "https://reuters.com/a", published_at: today, featured: true },
          ],
        }),
      }],
    });
  }

  it("le prompt exige l'URL exacte de l'article (jamais une page rubrique)", async () => {
    const config = makeConfigForNow();
    setupHappyPath(config);

    const request = new Request("http://localhost/api/cron", {
      headers: { authorization: `Bearer test-cron-secret` },
    });
    await GET(request);

    const prompt = (mockCreate.mock.calls[0][0] as { messages: Array<{ content: string }> }).messages[0].content;
    expect(prompt).toContain("PAGE EXACTE");
    expect(prompt).toContain("jamais une page rubrique ou d'accueil");
  });

  it("catches up a user whose send hour was missed 2 hours ago", async () => {
    const config = makeConfigForNow();
    config.send_hour = (config.send_hour as number) - 2;
    setupHappyPath(config);

    const request = new Request("http://localhost/api/cron", {
      headers: { authorization: `Bearer test-cron-secret` },
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.results.length).toBe(1);
    expect(data.results[0].status).toBe("sent");
  });

  it("does not catch up beyond the 12-hour window", async () => {
    const config = makeConfigForNow();
    config.send_hour = (config.send_hour as number) - 13;
    setupHappyPath(config);

    const request = new Request("http://localhost/api/cron", {
      headers: { authorization: `Bearer test-cron-secret` },
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.results.length).toBe(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("does not process a user whose send hour is still in the future", async () => {
    const config = makeConfigForNow();
    config.send_hour = (config.send_hour as number) + 1;
    setupHappyPath(config);

    const request = new Request("http://localhost/api/cron", {
      headers: { authorization: `Bearer test-cron-secret` },
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.results.length).toBe(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  // --- Budget temps : ne pas démarrer une génération qui sera tuée par le
  // timeout Vercel ; différer l'utilisateur à l'invocation suivante. ---
  it("defers the second user when the time budget is exhausted (deferred_next_run)", async () => {
    const configA = makeConfigForNow();
    configA.user_id = "user-a";
    const configB = makeConfigForNow();
    configB.user_id = "user-b";

    mockConfigsSelect.mockResolvedValue({ data: [configA, configB], error: null });
    mockProfilesSelect.mockResolvedValue({
      data: [
        { id: "user-a", plan: "pro", email_verified: true },
        { id: "user-b", plan: "pro", email_verified: true },
      ],
    });
    mockNewslettersMonthlySentSelect.mockResolvedValue({ data: [] });
    mockNewslettersCountSelect.mockResolvedValue({ count: 0 });
    mockNewslettersRecentSelect.mockResolvedValue({ data: [] });
    mockNewslettersInsert.mockResolvedValue({
      data: { id: "nl-a", user_id: "user-a", subject: "Test", content: {}, status: "draft" },
      error: null,
    });
    mockRecipientsSelect.mockResolvedValue({ data: [{ email: "user@test.com", name: "" }] });

    // Horloge simulée : la génération du 1er utilisateur consomme 50s du
    // budget (55s). Le 2e (Sonnet ≈ 30s estimés) ne tient plus -> différé.
    let fakeNow = 1_000_000;
    const nowSpy = vi.spyOn(Date, "now").mockImplementation(() => fakeNow);

    const today = new Date().toISOString().substring(0, 10);
    mockCreate.mockImplementation(() => {
      fakeNow += 50_000;
      return Promise.resolve({
        content: [{
          type: "text",
          text: JSON.stringify({
            editorial: "Édito",
            key_figures: [],
            articles: [
              { tag: "TECH", title: "Article A", hook: "H", content: "C", source: "Reuters", url: "https://reuters.com/a", published_at: today, featured: true },
            ],
          }),
        }],
      });
    });

    const request = new Request("http://localhost/api/cron", {
      headers: { authorization: `Bearer test-cron-secret` },
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.results.length).toBe(2);
    expect(data.results[0]).toMatchObject({ userId: "user-a", status: "sent" });
    expect(data.results[1]).toMatchObject({ userId: "user-b", status: "deferred_next_run" });
    // Une seule génération : le 2e utilisateur n'a pas consommé d'API
    expect(mockCreate).toHaveBeenCalledTimes(1);

    nowSpy.mockRestore();
  });
});
