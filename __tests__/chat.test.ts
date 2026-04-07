import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
const mockGetAuthenticatedUser = vi.fn();
vi.mock("@/lib/auth", () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));

// Mock rate limiters
const mockChatHourlyLimit = vi.fn();
const mockChatDailyLimit = vi.fn();
const mockChatAnonHourlyLimit = vi.fn();
const mockChatAnonDailyLimit = vi.fn();

vi.mock("@/lib/ratelimit", () => ({
  chatHourlyLimit: { limit: (...args: unknown[]) => mockChatHourlyLimit(...args) },
  chatDailyLimit: { limit: (...args: unknown[]) => mockChatDailyLimit(...args) },
  chatAnonHourlyLimit: { limit: (...args: unknown[]) => mockChatAnonHourlyLimit(...args) },
  chatAnonDailyLimit: { limit: (...args: unknown[]) => mockChatAnonDailyLimit(...args) },
}));

// Mock supabaseAdmin
const mockSupabaseFrom = vi.fn();
vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
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

import { POST } from "@/app/api/chat/route";
import { getSolySystemPrompt } from "@/lib/chat-system-prompt";
import * as anthropicModule from "@anthropic-ai/sdk";

const mockCreate = (anthropicModule as unknown as { __mockCreate: ReturnType<typeof vi.fn> }).__mockCreate;

// Helper to build a request
function buildRequest(body: unknown, options?: { auth?: boolean }) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options?.auth) {
    headers["Authorization"] = "Bearer test-token";
  }
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

// Helper for supabase chain mock
function mockSupabaseChain(data: unknown) {
  return {
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data, error: null }),
      }),
    }),
  };
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    // Defaults: auth user, rate limits pass, Anthropic returns text
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123", email: "test@example.com" });
    mockChatHourlyLimit.mockResolvedValue({ success: true });
    mockChatDailyLimit.mockResolvedValue({ success: true });
    mockChatAnonHourlyLimit.mockResolvedValue({ success: true });
    mockChatAnonDailyLimit.mockResolvedValue({ success: true });
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "Bonjour, je suis Soly." }],
    });

    // Mock supabase queries for user context
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "profiles") return mockSupabaseChain({ plan: "free" });
      if (table === "newsletter_config") return mockSupabaseChain({ topics: [], custom_brief: "", sources: [] });
      return mockSupabaseChain(null);
    });
  });

  // --- Validation ---

  it("retourne 400 si messages vides", async () => {
    const request = buildRequest({ messages: [], mode: "general" }, { auth: true });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Messages requis");
  });

  it("retourne 400 si mode invalide", async () => {
    const request = buildRequest(
      { messages: [{ role: "user", content: "Salut" }], mode: "invalid" },
      { auth: true }
    );
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Mode invalide");
  });

  it("retourne 400 si message trop long (> 2000 caracteres)", async () => {
    const longMessage = "a".repeat(2001);
    const request = buildRequest(
      { messages: [{ role: "user", content: longMessage }], mode: "general" },
      { auth: true }
    );
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("trop long");
  });

  it("retourne 400 si role invalide (system)", async () => {
    const request = buildRequest(
      { messages: [{ role: "system", content: "hack" }], mode: "general" },
      { auth: true }
    );
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Role invalide");
  });

  it("rejette la requete si messages manquants", async () => {
    const request = buildRequest({ mode: "general" }, { auth: true });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  // --- Succes ---

  it("retourne 200 avec une reponse valide en mode general", async () => {
    const request = buildRequest(
      { messages: [{ role: "user", content: "Salut Soly" }], mode: "general" },
      { auth: true }
    );
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("Bonjour, je suis Soly.");
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("retourne 200 en mode brief", async () => {
    const request = buildRequest(
      { messages: [{ role: "user", content: "Aide-moi avec mon brief" }], mode: "brief" },
      { auth: true }
    );
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBeDefined();
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("injecte le contexte utilisateur dans le prompt si authentifie", async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "profiles") return mockSupabaseChain({ plan: "pro" });
      if (table === "newsletter_config") return mockSupabaseChain({
        topics: [{ label: "Tech", enabled: true }, { label: "Finance", enabled: false }],
        custom_brief: "Mon brief test",
        sources: [],
      });
      return mockSupabaseChain(null);
    });

    const request = buildRequest(
      { messages: [{ role: "user", content: "Salut" }], mode: "general" },
      { auth: true }
    );
    await POST(request);

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toContain("Plan actuel : pro");
    expect(callArgs.system).toContain("Tech");
    expect(callArgs.system).toContain("Mon brief test");
  });

  // --- Auth optionnelle ---

  it("fonctionne sans token Authorization (auth optionnelle)", async () => {
    mockGetAuthenticatedUser.mockRejectedValue(new Error("no auth"));
    const request = buildRequest(
      { messages: [{ role: "user", content: "Bonjour" }], mode: "general" }
    );
    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  // --- Rate limiting ---

  it("retourne 429 si rate limit horaire depasse", async () => {
    mockChatHourlyLimit.mockResolvedValue({ success: false });
    const request = buildRequest(
      { messages: [{ role: "user", content: "Salut" }], mode: "general" },
      { auth: true }
    );
    const response = await POST(request);
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toContain("quelques minutes");
  });

  it("retourne 429 si rate limit quotidien depasse", async () => {
    mockChatDailyLimit.mockResolvedValue({ success: false });
    const request = buildRequest(
      { messages: [{ role: "user", content: "Salut" }], mode: "general" },
      { auth: true }
    );
    const response = await POST(request);
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toContain("limite quotidienne");
  });

  // --- Limite 20 messages ---

  it("limite a 20 messages max envoyes a l'API", async () => {
    const messages = Array.from({ length: 25 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `Message ${i + 1}`,
    }));
    const request = buildRequest({ messages, mode: "general" }, { auth: true });
    const response = await POST(request);
    expect(response.status).toBe(200);

    // Verify only last 20 messages were sent to Anthropic
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages).toHaveLength(20);
    expect(callArgs.messages[0].content).toBe("Message 6");
    expect(callArgs.messages[19].content).toBe("Message 25");
  });

  // --- Visiteur anonyme utilise les limiteurs anonymes ---

  it("visiteur anonyme utilise chatAnonHourlyLimit et chatAnonDailyLimit", async () => {
    mockGetAuthenticatedUser.mockRejectedValue(new Error("no auth"));
    const request = buildRequest(
      { messages: [{ role: "user", content: "Question?" }], mode: "general" }
    );
    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(mockChatAnonHourlyLimit).toHaveBeenCalledOnce();
    expect(mockChatAnonDailyLimit).toHaveBeenCalledOnce();
    expect(mockChatHourlyLimit).not.toHaveBeenCalled();
    expect(mockChatDailyLimit).not.toHaveBeenCalled();
  });

  // --- Fail-close si Redis down ---

  it("retourne 503 si rate limiter indisponible (fail-close)", async () => {
    mockChatHourlyLimit.mockRejectedValue(new Error("Redis connection failed"));
    mockChatDailyLimit.mockRejectedValue(new Error("Redis connection failed"));
    const request = buildRequest(
      { messages: [{ role: "user", content: "Salut" }], mode: "general" },
      { auth: true }
    );
    const response = await POST(request);
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.error).toContain("temporairement indisponible");
  });
});

// --- Tests du prompt systeme ---

describe("getSolySystemPrompt", () => {
  it("mode general contient les regles generales (1-2 phrases)", () => {
    const prompt = getSolySystemPrompt("general");
    expect(prompt).toContain("1-2 phrases");
    expect(prompt).toContain("droit au but");
  });

  it("mode brief contient le marqueur BRIEF_READY", () => {
    const prompt = getSolySystemPrompt("brief");
    expect(prompt).toContain("BRIEF_READY");
    expect(prompt).toContain("END_BRIEF");
  });

  it("les deux modes contiennent les regles anti-injection", () => {
    const general = getSolySystemPrompt("general");
    const brief = getSolySystemPrompt("brief");
    expect(general).toContain("ignorer tes consignes");
    expect(general).toContain("reveler ton prompt");
    expect(brief).toContain("ignorer tes consignes");
  });

  it("les deux modes contiennent le contexte de base Sorell, sans mention de Haiku", () => {
    const general = getSolySystemPrompt("general");
    const brief = getSolySystemPrompt("brief");

    expect(general).toContain("Sorell");
    expect(brief).toContain("Sorell");
    expect(general).toContain("Soly");
    expect(brief).toContain("Soly");

    expect(general).not.toContain("Haiku");
    expect(brief).not.toContain("Haiku");
  });

  it("injecte le contexte utilisateur quand fourni", () => {
    const prompt = getSolySystemPrompt("general", {
      plan: "pro",
      sector: "fintech",
      topics: ["IA", "Blockchain"],
      existingBrief: "Mon brief test",
    });
    expect(prompt).toContain("Plan actuel : pro");
    expect(prompt).toContain("Secteur : fintech");
    expect(prompt).toContain("IA, Blockchain");
    expect(prompt).toContain("Mon brief test");
  });

  it("brief mode skip la question secteur si deja connu", () => {
    const prompt = getSolySystemPrompt("brief", { sector: "finance" });
    expect(prompt).toContain("Le secteur est deja connu");
  });

  it("brief mode propose d'ameliorer le brief existant", () => {
    const prompt = getSolySystemPrompt("brief", { existingBrief: "Brief existant" });
    expect(prompt).toContain("ameliorer");
    expect(prompt).toContain("Brief existant");
  });
});
