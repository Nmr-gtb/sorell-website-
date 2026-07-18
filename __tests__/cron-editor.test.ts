import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mode Éditeur dans le cron : génère un brouillon au lieu d'envoyer,
// ne regénère rien quand un brouillon attend déjà, et retombe sur le
// mode auto pour les plans non éligibles.
// ---------------------------------------------------------------------------

// Mock Supabase admin
const mockConfigsSelect = vi.fn();
const mockProfilesSelect = vi.fn();
const mockNewslettersCountSelect = vi.fn();
const mockNewslettersMonthlySentSelect = vi.fn();
const mockNewslettersRecentSelect = vi.fn();
const mockNewslettersInsert = vi.fn();
const mockNewslettersInsertPayload = vi.fn();
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
            not: () => mockConfigsSelect(),
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
            if (args.length > 1) {
              return {
                eq: () => ({
                  eq: () => ({
                    gte: () => mockNewslettersCountSelect(),
                  }),
                }),
              };
            }
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
            return {
              eq: () => ({
                order: () => ({
                  limit: () => mockNewslettersRecentSelect(),
                }),
              }),
            };
          },
          insert: (...args: unknown[]) => {
            mockNewslettersInsertPayload(...args);
            return {
              select: () => ({
                single: () => mockNewslettersInsert(),
              }),
            };
          },
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

// Mock Resend
vi.mock("resend", () => {
  const mockSend = vi.fn().mockResolvedValue({ id: "email-123" });
  return {
    Resend: class {
      emails = { send: mockSend };
    },
    __mockSend: mockSend,
  };
});

// Mock email template
vi.mock("@/lib/email-template", () => ({
  buildNewsletterHtml: async () => "<html>Newsletter</html>",
}));

import { GET } from "@/app/api/cron/route";
import * as anthropicModule from "@anthropic-ai/sdk";
import * as resendModule from "resend";

const mockCreate = (anthropicModule as unknown as { __mockCreate: ReturnType<typeof vi.fn> }).__mockCreate;
const mockSend = (resendModule as unknown as { __mockSend: ReturnType<typeof vi.fn> }).__mockSend;

// Config alignée sur "maintenant" (heure de Paris) pour passer les checks de planification
function makeConfigForNow(): Record<string, unknown> {
  const now = new Date();
  const franceTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return {
    user_id: "user-biz",
    topics: [{ label: "Tech", enabled: true }],
    sources: [],
    custom_brief: "",
    frequency: "weekly",
    send_day: dayNames[franceTime.getDay()],
    send_hour: franceTime.getHours(),
    last_sent_at: null,
    edit_mode: "editor",
    pending_draft_id: null,
    brand_color: "#005058",
    custom_logo_url: null,
    text_color: "#111827",
    bg_color: "#FFFFFF",
    body_text_color: "#4B5563",
  };
}

function makeClaudeResponse(): string {
  const today = new Date().toISOString().substring(0, 10);
  return JSON.stringify({
    editorial: "Cette semaine dans la tech...",
    key_figures: [{ value: "47,2%", label: "croissance", context: "Reuters" }],
    articles: [
      { tag: "TECH", title: "Article Frais A", hook: "Accroche", content: "Contenu.", source: "Reuters", url: "https://reuters.com/a", published_at: today, featured: true },
      { tag: "MARCHE", title: "Article Frais B", hook: "Accroche", content: "Contenu.", source: "Les Echos", url: "https://lesechos.fr/b", published_at: today, featured: false },
      { tag: "IA", title: "Article Frais C", hook: "Accroche", content: "Contenu.", source: "TechCrunch", url: "https://techcrunch.com/c", published_at: today, featured: false },
    ],
  });
}

function makeCronRequest(): Request {
  return new Request("http://localhost/api/cron", {
    headers: { authorization: `Bearer test-cron-secret` },
  });
}

describe("GET /api/cron - mode éditeur", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    process.env.ANTHROPIC_API_KEY = "test-key";
    process.env.RESEND_API_KEY = "test-resend-key";

    mockNewslettersMonthlySentSelect.mockResolvedValue({ data: [] });
    mockNewslettersCountSelect.mockResolvedValue({ count: 0 });
    mockNewslettersRecentSelect.mockResolvedValue({ data: [] });
    mockRecipientsSelect.mockResolvedValue({
      data: [{ email: "user@test.com", name: "" }],
    });
  });

  it("creates a draft and does NOT send when edit_mode=editor for a business plan", async () => {
    const config = makeConfigForNow();
    mockConfigsSelect.mockResolvedValue({ data: [config], error: null });
    mockProfilesSelect.mockResolvedValue({
      data: [{ id: "user-biz", plan: "business", email_verified: true }],
    });
    mockNewslettersInsert.mockResolvedValue({
      data: { id: "draft-789", user_id: "user-biz", subject: "Test", content: {}, status: "draft" },
      error: null,
    });
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: makeClaudeResponse() }] });

    const response = await GET(makeCronRequest());
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.results.length).toBe(1);
    expect(data.results[0].status).toBe("editor_draft_created");
    expect(data.results[0].newsletterId).toBe("draft-789");

    // Aucun email envoyé
    expect(mockSend).not.toHaveBeenCalled();
    // La newsletter n'est PAS passée en "sent"
    expect(mockNewslettersUpdate).not.toHaveBeenCalled();
    // pending_draft_id stocké, sans toucher à last_sent_at
    expect(mockConfigUpdate).toHaveBeenCalledTimes(1);
    expect(mockConfigUpdate).toHaveBeenCalledWith({ pending_draft_id: "draft-789" });
    const updatePayload = mockConfigUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(updatePayload.last_sent_at).toBeUndefined();

    // Instantané d'origine figé à la création (pour le bouton Réinitialiser)
    const insertPayload = mockNewslettersInsertPayload.mock.calls[0][0] as Record<string, unknown>;
    expect(insertPayload.status).toBe("draft");
    expect(insertPayload.original_content).toBeDefined();
    expect(insertPayload.original_content).toEqual(insertPayload.content);
    expect(insertPayload.original_subject).toBe(insertPayload.subject);
  });

  it("does nothing when a pending draft already awaits validation", async () => {
    const config = makeConfigForNow();
    config.pending_draft_id = "draft-existing";
    mockConfigsSelect.mockResolvedValue({ data: [config], error: null });
    mockProfilesSelect.mockResolvedValue({
      data: [{ id: "user-biz", plan: "business", email_verified: true }],
    });

    const response = await GET(makeCronRequest());
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.results.length).toBe(1);
    expect(data.results[0].status).toBe("editor_draft_waiting");

    // Ni génération, ni envoi, ni écriture
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
    expect(mockNewslettersInsert).not.toHaveBeenCalled();
    expect(mockConfigUpdate).not.toHaveBeenCalled();
  });

  it("caps the serverless newsletter length for Opus plans to fit the Vercel 60s limit", async () => {
    // Enterprise = Opus : une génération de 12 articles prendrait ~120s et
    // dépasserait le timeout Vercel (60s). Le cron plafonne donc à 4 articles.
    // L'utilisateur complète ensuite via l'éditeur ("Ajouter un article").
    const config = makeConfigForNow();
    config.article_count = 12;
    mockConfigsSelect.mockResolvedValue({ data: [config], error: null });
    mockProfilesSelect.mockResolvedValue({
      data: [{ id: "user-biz", plan: "enterprise", email_verified: true }],
    });
    mockNewslettersInsert.mockResolvedValue({
      data: { id: "draft-12", user_id: "user-biz", subject: "Test", content: {}, status: "draft" },
      error: null,
    });
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: makeClaudeResponse() }] });

    const response = await GET(makeCronRequest());
    expect(response.status).toBe(200);

    // Le prompt et le budget de tokens suivent le nombre PLAFONNÉ (4), pas 12.
    const createArgs = mockCreate.mock.calls[0][0] as { max_tokens: number; messages: Array<{ content: string }> };
    expect(createArgs.messages[0].content).toContain("4 actualités RÉELLES");
    expect(createArgs.messages[0].content).not.toContain("12 actualités RÉELLES");
    expect(createArgs.max_tokens).toBe(3000 + 4 * 550); // 5200
  });

  it("honours a configured length that already fits under the serverless cap", async () => {
    // 3 articles < plafond Opus (4) : la valeur configurée passe telle quelle.
    const config = makeConfigForNow();
    config.article_count = 3;
    mockConfigsSelect.mockResolvedValue({ data: [config], error: null });
    mockProfilesSelect.mockResolvedValue({
      data: [{ id: "user-biz", plan: "enterprise", email_verified: true }],
    });
    mockNewslettersInsert.mockResolvedValue({
      data: { id: "draft-3", user_id: "user-biz", subject: "Test", content: {}, status: "draft" },
      error: null,
    });
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: makeClaudeResponse() }] });

    const response = await GET(makeCronRequest());
    expect(response.status).toBe(200);

    const createArgs = mockCreate.mock.calls[0][0] as { max_tokens: number; messages: Array<{ content: string }> };
    expect(createArgs.messages[0].content).toContain("3 actualités RÉELLES");
    expect(createArgs.max_tokens).toBe(3000 + 3 * 550); // 4650
  });

  it("does not create a draft in editor mode when no fresh content is found", async () => {
    const config = makeConfigForNow();
    mockConfigsSelect.mockResolvedValue({ data: [config], error: null });
    mockProfilesSelect.mockResolvedValue({
      data: [{ id: "user-biz", plan: "business", email_verified: true }],
    });

    // Tous les articles retournés par Claude sont périmés (> 90 jours)
    const staleResponse = JSON.stringify({
      editorial: "Semaine calme.",
      key_figures: [],
      articles: [
        { tag: "TECH", title: "Article Périmé", hook: "A", content: "C", source: "Reuters", url: "https://reuters.com/old", published_at: "2020-01-01", featured: true },
      ],
    });
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: staleResponse }] });

    const response = await GET(makeCronRequest());
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.results.length).toBe(1);
    expect(data.results[0].status).toBe("skipped_no_fresh_content");
    // Ni brouillon créé, ni pending_draft_id stocké, ni envoi
    expect(mockNewslettersInsert).not.toHaveBeenCalled();
    expect(mockConfigUpdate).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("falls back to auto mode (generate + send) when the plan is not eligible", async () => {
    const config = makeConfigForNow();
    config.user_id = "user-pro";
    mockConfigsSelect.mockResolvedValue({ data: [config], error: null });
    mockProfilesSelect.mockResolvedValue({
      data: [{ id: "user-pro", plan: "pro", email_verified: true }],
    });
    mockNewslettersInsert.mockResolvedValue({
      data: { id: "nl-456", user_id: "user-pro", subject: "Test", content: {}, status: "draft" },
      error: null,
    });
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: makeClaudeResponse() }] });

    const response = await GET(makeCronRequest());
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.results.length).toBe(1);
    expect(data.results[0].status).toBe("sent");
    expect(mockSend).toHaveBeenCalled();
    // En mode auto le seul update de config est last_sent_at (pas de pending_draft_id)
    expect(mockConfigUpdate).toHaveBeenCalledTimes(1);
    const updatePayload = mockConfigUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(updatePayload.last_sent_at).toBeDefined();
    expect(updatePayload.pending_draft_id).toBeUndefined();

    // En mode auto, pas d'instantané d'origine (inutile : la newsletter part directement)
    const insertPayload = mockNewslettersInsertPayload.mock.calls[0][0] as Record<string, unknown>;
    expect(insertPayload.original_content).toBeUndefined();
    expect(insertPayload.original_subject).toBeUndefined();
  });
});
