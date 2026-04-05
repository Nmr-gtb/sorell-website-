import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const mockGetAuthenticatedAdmin = vi.fn();
const mockIsValidUUID = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  getAuthenticatedAdmin: (...args: unknown[]) => mockGetAuthenticatedAdmin(...args),
  isValidUUID: (...args: unknown[]) => mockIsValidUUID(...args),
}));

const mockFrom = vi.fn();
vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const mockSubscriptionsList = vi.fn();
vi.mock("stripe", () => ({
  default: class {
    subscriptions = { list: mockSubscriptionsList };
  },
}));

const mockBuildNewsletterPrompt = vi.fn();
const mockExtractPreviousTitles = vi.fn();
vi.mock("@/lib/newsletter-generator", () => ({
  buildNewsletterPrompt: (...args: unknown[]) => mockBuildNewsletterPrompt(...args),
  extractPreviousTitles: (...args: unknown[]) => mockExtractPreviousTitles(...args),
}));

// --- Imports ---

import { GET as statsGET } from "@/app/api/admin/stats/route";
import { GET as newslettersGET } from "@/app/api/admin/newsletters/route";
import { GET as newsletterDetailGET } from "@/app/api/admin/newsletters/[id]/route";
import { GET as lifecycleGET } from "@/app/api/admin/lifecycle/route";
import { GET as promptsGET } from "@/app/api/admin/prompts/[userId]/route";

// --- Helpers ---

const ADMIN = { email: "noe@sorell.fr", role: "admin" };
const VALID_UUID = "11111111-1111-1111-1111-111111111111";

function buildRequest(url: string) {
  return new Request(`http://localhost${url}`, {
    method: "GET",
    headers: { cookie: "admin_token=test" },
  });
}

function makeParams(key: string, value: string) {
  return { params: Promise.resolve({ [key]: value }) };
}

// Chainable Supabase mock
function chainable(finalData: unknown = null, count: number | null = null) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "eq", "gte", "not", "or", "in", "order", "range", "limit", "single", "delete", "insert", "maybeSingle"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.then = (resolve: (val: { data: unknown; count: number | null; error: null }) => void) => {
    resolve({ data: finalData, count, error: null });
  };
  Object.defineProperty(chain, Symbol.toStringTag, { value: "Promise" });
  return chain;
}

// --- Tests ---

describe("GET /api/admin/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedAdmin.mockReturnValue(ADMIN);
    mockSubscriptionsList.mockResolvedValue({ data: [] });
    mockFrom.mockImplementation(() => chainable([], 0));
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthenticatedAdmin.mockReturnValue(null);
    const res = await statsGET(buildRequest("/api/admin/stats"));
    expect(res.status).toBe(401);
  });

  it("returns all KPI fields", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") return chainable([{ plan: "free" }, { plan: "pro" }], 2);
      return chainable([], 0);
    });

    const res = await statsGET(buildRequest("/api/admin/stats"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("totalUsers");
    expect(data).toHaveProperty("newUsers");
    expect(data).toHaveProperty("activeUsers");
    expect(data).toHaveProperty("mrr");
    expect(data).toHaveProperty("trialConversionRate");
    expect(data).toHaveProperty("planDistribution");
    expect(data).toHaveProperty("signupsChart");
    expect(data).toHaveProperty("recentUsers");
  });

  it("calculates MRR from Stripe subscriptions", async () => {
    mockSubscriptionsList.mockResolvedValue({
      data: [
        {
          items: {
            data: [{ price: { unit_amount: 1900, recurring: { interval: "month" } } }],
          },
        },
        {
          items: {
            data: [{ price: { unit_amount: 49000, recurring: { interval: "year" } } }],
          },
        },
      ],
    });

    mockFrom.mockImplementation(() => chainable([], 0));
    const res = await statsGET(buildRequest("/api/admin/stats"));
    expect(res.status).toBe(200);
    const data = await res.json();
    // MRR = 19 (monthly) + 490/12 (~40.83) = ~60, rounded
    expect(data.mrr).toBe(60);
  });

  it("handles Stripe error gracefully (MRR = 0)", async () => {
    mockSubscriptionsList.mockRejectedValue(new Error("Stripe down"));
    mockFrom.mockImplementation(() => chainable([], 0));

    const res = await statsGET(buildRequest("/api/admin/stats"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.mrr).toBe(0);
  });
});

describe("GET /api/admin/newsletters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedAdmin.mockReturnValue(ADMIN);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthenticatedAdmin.mockReturnValue(null);
    const res = await newslettersGET(buildRequest("/api/admin/newsletters"));
    expect(res.status).toBe(401);
  });

  it("returns empty list when no newsletters", async () => {
    mockFrom.mockImplementation(() => chainable([], 0));
    const res = await newslettersGET(buildRequest("/api/admin/newsletters"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.newsletters).toEqual([]);
    expect(data.total).toBe(0);
  });

  it("returns 400 for invalid userId filter", async () => {
    mockIsValidUUID.mockReturnValue(false);
    const res = await newslettersGET(buildRequest("/api/admin/newsletters?userId=not-uuid"));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid status filter", async () => {
    mockFrom.mockImplementation(() => chainable([], 0));
    const res = await newslettersGET(buildRequest("/api/admin/newsletters?status=invalid"));
    expect(res.status).toBe(400);
  });

  it("enriches newsletters with user info and event counts", async () => {
    const newsletters = [
      { id: "nl1", user_id: "u1", subject: "Test", status: "sent", recipient_count: 5, created_at: "2026-01-01", sent_at: "2026-01-01" },
    ];
    const profiles = [{ id: "u1", email: "a@test.com", full_name: "Alice" }];
    const events = [
      { newsletter_id: "nl1", event_type: "open" },
      { newsletter_id: "nl1", event_type: "open" },
      { newsletter_id: "nl1", event_type: "click" },
    ];

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainable(newsletters, 1); // newsletters
      if (callCount === 2) return chainable(profiles); // profiles
      if (callCount === 3) return chainable(events); // events
      return chainable([]);
    });

    const res = await newslettersGET(buildRequest("/api/admin/newsletters"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.newsletters[0].user_email).toBe("a@test.com");
    expect(data.newsletters[0].opens).toBe(2);
    expect(data.newsletters[0].clicks).toBe(1);
    expect(data.newsletters[0].open_rate).toBe(40); // 2/5 * 100
    expect(data.newsletters[0].click_rate).toBe(20); // 1/5 * 100
  });
});

describe("GET /api/admin/newsletters/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedAdmin.mockReturnValue(ADMIN);
    mockIsValidUUID.mockReturnValue(true);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthenticatedAdmin.mockReturnValue(null);
    const res = await newsletterDetailGET(buildRequest(`/api/admin/newsletters/${VALID_UUID}`), makeParams("id", VALID_UUID));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid UUID", async () => {
    mockIsValidUUID.mockReturnValue(false);
    const res = await newsletterDetailGET(buildRequest("/api/admin/newsletters/bad"), makeParams("id", "bad"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when newsletter not found", async () => {
    mockFrom.mockImplementation(() => chainable(null));
    const res = await newsletterDetailGET(buildRequest(`/api/admin/newsletters/${VALID_UUID}`), makeParams("id", VALID_UUID));
    expect(res.status).toBe(404);
  });

  it("returns newsletter with profile and events", async () => {
    const newsletter = { id: VALID_UUID, user_id: "u1", subject: "Test" };
    const profile = { id: "u1", email: "a@test.com", full_name: "Alice" };
    const events = [{ newsletter_id: VALID_UUID, event_type: "open" }];

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainable(newsletter);
      if (callCount === 2) return chainable(profile);
      if (callCount === 3) return chainable(events);
      return chainable([]);
    });

    const res = await newsletterDetailGET(buildRequest(`/api/admin/newsletters/${VALID_UUID}`), makeParams("id", VALID_UUID));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.newsletter).toBeDefined();
    expect(data.profile).toBeDefined();
    expect(data.events).toHaveLength(1);
  });
});

describe("GET /api/admin/lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedAdmin.mockReturnValue(ADMIN);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthenticatedAdmin.mockReturnValue(null);
    const res = await lifecycleGET(buildRequest("/api/admin/lifecycle"));
    expect(res.status).toBe(401);
  });

  it("returns pipeline with stage counts", async () => {
    const profiles = [
      { id: "u1", email: "a@test.com", full_name: "Alice", plan: "free", trial_ends_at: null, created_at: "2026-01-01" },
      { id: "u2", email: "b@test.com", full_name: "Bob", plan: "pro", trial_ends_at: "2026-05-01", created_at: "2026-03-01" },
    ];
    const lifecycleEmails = [
      { user_id: "u1", email_type: "welcome", sent_at: "2026-01-01" },
      { user_id: "u2", email_type: "welcome", sent_at: "2026-03-01" },
      { user_id: "u2", email_type: "onboarding", sent_at: "2026-03-02" },
    ];
    const configs = [{ user_id: "u2" }];
    const sentNewsletters = [{ user_id: "u2" }];

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainable(profiles); // profiles
      if (callCount === 2) return chainable(lifecycleEmails); // lifecycle_emails
      if (callCount === 3) return chainable(configs); // newsletter_config
      if (callCount === 4) return chainable(sentNewsletters); // newsletters
      return chainable([]);
    });

    const res = await lifecycleGET(buildRequest("/api/admin/lifecycle"));
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.pipeline).toHaveLength(2);
    expect(data.stageCounts).toBeDefined();
    expect(data.stages).toBeDefined();

    // User 1 (free, welcome only) = welcome_sent
    const u1 = data.pipeline.find((p: { id: string }) => p.id === "u1");
    expect(u1.current_stage).toBe("welcome_sent");
    expect(u1.is_paid).toBe(false);

    // User 2 (pro, configured, sent newsletters) = converted (because isPaid)
    const u2 = data.pipeline.find((p: { id: string }) => p.id === "u2");
    expect(u2.current_stage).toBe("converted");
    expect(u2.is_paid).toBe(true);
    expect(u2.has_config).toBe(true);
    expect(u2.has_sent_newsletter).toBe(true);
  });
});

describe("GET /api/admin/prompts/[userId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedAdmin.mockReturnValue(ADMIN);
    mockIsValidUUID.mockReturnValue(true);
    mockBuildNewsletterPrompt.mockReturnValue("Generated prompt content");
    mockExtractPreviousTitles.mockReturnValue(["Title 1", "Title 2"]);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthenticatedAdmin.mockReturnValue(null);
    const res = await promptsGET(buildRequest(`/api/admin/prompts/${VALID_UUID}`), makeParams("userId", VALID_UUID));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid UUID", async () => {
    mockIsValidUUID.mockReturnValue(false);
    const res = await promptsGET(buildRequest("/api/admin/prompts/bad"), makeParams("userId", "bad"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when user not found", async () => {
    mockFrom.mockImplementation(() => chainable(null));
    const res = await promptsGET(buildRequest(`/api/admin/prompts/${VALID_UUID}`), makeParams("userId", VALID_UUID));
    expect(res.status).toBe(404);
  });

  it("returns prompt=null when user has no config", async () => {
    const profile = { id: VALID_UUID, email: "a@test.com", full_name: "Alice", plan: "pro" };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainable(profile); // profiles
      if (callCount === 2) return chainable(null); // config = null
      return chainable([]);
    });

    const res = await promptsGET(buildRequest(`/api/admin/prompts/${VALID_UUID}`), makeParams("userId", VALID_UUID));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.profile).toBeDefined();
    expect(data.config).toBeNull();
    expect(data.prompt).toBeNull();
  });

  it("returns reconstructed prompt when config exists", async () => {
    const profile = { id: VALID_UUID, email: "a@test.com", full_name: "Alice", plan: "pro" };
    const config = { user_id: VALID_UUID, topics: ["tech"], custom_topics: ["ai"], sources: "", custom_brief: "My brief" };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainable(profile);
      if (callCount === 2) return chainable(config);
      if (callCount === 3) return chainable([]); // recent newsletters
      if (callCount === 4) return chainable(null); // last newsletter
      return chainable([]);
    });

    const res = await promptsGET(buildRequest(`/api/admin/prompts/${VALID_UUID}`), makeParams("userId", VALID_UUID));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.prompt).toBe("Generated prompt content");
    expect(data.previousTitles).toEqual(["Title 1", "Title 2"]);
    expect(mockBuildNewsletterPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        topics: "tech, ai",
        customBrief: "My brief",
      })
    );
  });
});
