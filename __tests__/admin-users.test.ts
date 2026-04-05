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
    auth: {
      admin: {
        deleteUser: vi.fn().mockResolvedValue({}),
      },
    },
  },
}));

// --- Imports ---

import { GET as usersGET } from "@/app/api/admin/users/route";
import { GET as userDetailGET, PATCH as userPATCH, DELETE as userDELETE } from "@/app/api/admin/users/[id]/route";

// --- Helpers ---

const ADMIN = { email: "noe@sorell.fr", role: "admin" };
const VALID_UUID = "11111111-1111-1111-1111-111111111111";

function buildRequest(url: string, method = "GET", body?: Record<string, unknown>) {
  const opts: RequestInit = { method, headers: { cookie: "admin_token=test" } };
  if (body) {
    opts.headers = { ...opts.headers, "Content-Type": "application/json" } as Record<string, string>;
    opts.body = JSON.stringify(body);
  }
  return new Request(`http://localhost${url}`, opts);
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// Chainable Supabase mock factory
function chainable(finalData: unknown = null, count: number | null = null) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "eq", "gte", "not", "or", "ilike", "in", "order", "range", "limit", "single", "delete", "update", "insert", "maybeSingle"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // Terminal: resolve with data
  chain.then = (resolve: (val: { data: unknown; count: number | null; error: null }) => void) => {
    resolve({ data: finalData, count, error: null });
  };
  // Make it thenable (Promise-like)
  Object.defineProperty(chain, Symbol.toStringTag, { value: "Promise" });
  return chain;
}

// --- Tests ---

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedAdmin.mockReturnValue(ADMIN);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthenticatedAdmin.mockReturnValue(null);
    const res = await usersGET(buildRequest("/api/admin/users"));
    expect(res.status).toBe(401);
  });

  it("returns paginated users with enrichment data", async () => {
    const mockUsers = [
      { id: "u1", email: "a@test.com", full_name: "Alice", plan: "pro", created_at: "2026-01-01" },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") return chainable(mockUsers, 1);
      if (table === "newsletters") return chainable([{ user_id: "u1" }, { user_id: "u1" }]);
      if (table === "recipients") return chainable([{ user_id: "u1" }]);
      return chainable([]);
    });

    const res = await usersGET(buildRequest("/api/admin/users?page=1&limit=10"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.users).toBeDefined();
    expect(data.total).toBeDefined();
    expect(data.page).toBe(1);
    expect(data.limit).toBe(10);
  });

  it("returns 400 for invalid plan filter", async () => {
    mockFrom.mockImplementation(() => chainable([], 0));
    const res = await usersGET(buildRequest("/api/admin/users?plan=invalid"));
    expect(res.status).toBe(400);
  });

  it("clamps page and limit to safe bounds", async () => {
    mockFrom.mockImplementation(() => chainable([], 0));
    // page > 1000 should be clamped
    const res = await usersGET(buildRequest("/api/admin/users?page=5000&limit=500"));
    expect(res.status).toBe(200);
  });
});

describe("GET /api/admin/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedAdmin.mockReturnValue(ADMIN);
    mockIsValidUUID.mockReturnValue(true);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthenticatedAdmin.mockReturnValue(null);
    const res = await userDetailGET(buildRequest(`/api/admin/users/${VALID_UUID}`), makeParams(VALID_UUID));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid UUID", async () => {
    mockIsValidUUID.mockReturnValue(false);
    const res = await userDetailGET(buildRequest("/api/admin/users/not-a-uuid"), makeParams("not-a-uuid"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when user not found", async () => {
    mockFrom.mockImplementation(() => chainable(null));
    const res = await userDetailGET(buildRequest(`/api/admin/users/${VALID_UUID}`), makeParams(VALID_UUID));
    expect(res.status).toBe(404);
  });

  it("returns full user detail with related data", async () => {
    const profile = { id: VALID_UUID, email: "a@test.com", plan: "pro" };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainable(profile); // profiles
      if (callCount === 2) return chainable({ user_id: VALID_UUID, topics: ["tech"] }); // config
      if (callCount === 3) return chainable([]); // newsletters
      if (callCount === 4) return chainable([]); // recipients
      if (callCount === 5) return chainable([]); // lifecycle_emails
      if (callCount === 6) return chainable([]); // referrals
      return chainable([]);
    });

    const res = await userDetailGET(buildRequest(`/api/admin/users/${VALID_UUID}`), makeParams(VALID_UUID));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.profile).toBeDefined();
    expect(data.config).toBeDefined();
    expect(data.newsletters).toBeDefined();
    expect(data.recipients).toBeDefined();
    expect(data.lifecycleEmails).toBeDefined();
    expect(data.referrals).toBeDefined();
  });
});

describe("PATCH /api/admin/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedAdmin.mockReturnValue(ADMIN);
    mockIsValidUUID.mockReturnValue(true);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthenticatedAdmin.mockReturnValue(null);
    const res = await userPATCH(
      buildRequest(`/api/admin/users/${VALID_UUID}`, "PATCH", { plan: "pro" }),
      makeParams(VALID_UUID)
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid UUID", async () => {
    mockIsValidUUID.mockReturnValue(false);
    const res = await userPATCH(
      buildRequest("/api/admin/users/bad", "PATCH", { plan: "pro" }),
      makeParams("bad")
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid plan value", async () => {
    const res = await userPATCH(
      buildRequest(`/api/admin/users/${VALID_UUID}`, "PATCH", { plan: "super_plan" }),
      makeParams(VALID_UUID)
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for full_name > 200 chars", async () => {
    const res = await userPATCH(
      buildRequest(`/api/admin/users/${VALID_UUID}`, "PATCH", { full_name: "x".repeat(201) }),
      makeParams(VALID_UUID)
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when no valid fields provided", async () => {
    const res = await userPATCH(
      buildRequest(`/api/admin/users/${VALID_UUID}`, "PATCH", { invalid_field: "test" }),
      makeParams(VALID_UUID)
    );
    expect(res.status).toBe(400);
  });

  it("updates plan successfully", async () => {
    const updated = { id: VALID_UUID, plan: "business" };
    mockFrom.mockImplementation(() => chainable(updated));

    const res = await userPATCH(
      buildRequest(`/api/admin/users/${VALID_UUID}`, "PATCH", { plan: "business" }),
      makeParams(VALID_UUID)
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.profile).toBeDefined();
  });
});

describe("DELETE /api/admin/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedAdmin.mockReturnValue(ADMIN);
    mockIsValidUUID.mockReturnValue(true);
    mockFrom.mockImplementation(() => chainable([]));
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthenticatedAdmin.mockReturnValue(null);
    const res = await userDELETE(
      buildRequest(`/api/admin/users/${VALID_UUID}`, "DELETE"),
      makeParams(VALID_UUID)
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid UUID", async () => {
    mockIsValidUUID.mockReturnValue(false);
    const res = await userDELETE(
      buildRequest("/api/admin/users/bad", "DELETE"),
      makeParams("bad")
    );
    expect(res.status).toBe(400);
  });

  it("cascade deletes user and related data", async () => {
    const res = await userDELETE(
      buildRequest(`/api/admin/users/${VALID_UUID}`, "DELETE"),
      makeParams(VALID_UUID)
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Should have called from() multiple times for cascade deletion
    expect(mockFrom).toHaveBeenCalledWith("newsletters");
    expect(mockFrom).toHaveBeenCalledWith("recipients");
    expect(mockFrom).toHaveBeenCalledWith("newsletter_config");
    expect(mockFrom).toHaveBeenCalledWith("lifecycle_emails");
    expect(mockFrom).toHaveBeenCalledWith("referrals");
    expect(mockFrom).toHaveBeenCalledWith("profiles");
  });
});
