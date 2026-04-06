import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const mockGetAuthenticatedUser = vi.fn();
vi.mock("@/lib/auth", () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));

// Track all calls per table for precise control
let maybeSingleResults: unknown[] = [];
let maybeSingleIndex = 0;
let countResult: unknown = { count: 0 };
let insertResult: unknown = { error: null };
let orderResult: unknown = { data: [] };

const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
const mockInsert = vi.fn().mockImplementation(() => insertResult);

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: () => ({
      select: (...args: unknown[]) => {
        // count query: select("id", { count: "exact", head: true })
        if (args.length > 1 && typeof args[1] === "object" && (args[1] as Record<string, unknown>).count === "exact") {
          return {
            eq: () => ({ eq: () => ({ gte: () => Promise.resolve(countResult) }) }),
          };
        }
        return {
          eq: () => ({
            maybeSingle: () => {
              const result = maybeSingleResults[maybeSingleIndex] ?? null;
              maybeSingleIndex++;
              return Promise.resolve({ data: result, error: null });
            },
            order: () => Promise.resolve(orderResult),
            eq: () => ({
              maybeSingle: () => {
                const result = maybeSingleResults[maybeSingleIndex] ?? null;
                maybeSingleIndex++;
                return Promise.resolve({ data: result, error: null });
              },
            }),
          }),
        };
      },
      insert: (...args: unknown[]) => mockInsert(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    }),
  },
}));

vi.mock("crypto", () => ({
  default: {
    randomBytes: () => ({
      toString: () => "a1b2c3d4",
    }),
  },
}));

import { GET, POST } from "@/app/api/referral/route";

// --- Helpers ---

function makeGetRequest() {
  return new Request("http://localhost/api/referral", { method: "GET" });
}

function makePostRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/referral", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// --- Tests GET /api/referral ---

describe("GET /api/referral", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    maybeSingleResults = [];
    maybeSingleIndex = 0;
    orderResult = { data: [] };
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);
    const response = await GET(makeGetRequest());
    expect(response.status).toBe(401);
  });

  it("returns 403 when user is on Free plan", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123" });
    maybeSingleResults = [{ plan: "free", referral_code: null }];

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.eligible).toBe(false);
  });

  it("returns referral data for Pro user with existing code", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123" });
    maybeSingleResults = [{ plan: "pro", referral_code: "ABCD1234" }];
    orderResult = {
      data: [
        { id: "r1", status: "converted", created_at: "2026-03-01", converted_at: "2026-03-15" },
        { id: "r2", status: "pending", created_at: "2026-03-20", converted_at: null },
      ],
    };

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.eligible).toBe(true);
    expect(data.code).toBe("ABCD1234");
    expect(data.referralLink).toBe("https://sorell.fr/?ref=ABCD1234");
    expect(data.stats.total).toBe(2);
    expect(data.stats.converted).toBe(1);
    expect(data.stats.pending).toBe(1);
  });

  it("generates a code for Pro user without one", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123" });
    maybeSingleResults = [{ plan: "business", referral_code: null }];
    orderResult = { data: [] };

    const response = await GET(makeGetRequest());
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.eligible).toBe(true);
    expect(data.code).toBe("A1B2C3D4"); // from crypto mock
  });
});

// --- Tests POST /api/referral ---

describe("POST /api/referral", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    maybeSingleResults = [];
    maybeSingleIndex = 0;
    countResult = { count: 0 };
    insertResult = { error: null };
    mockGetAuthenticatedUser.mockResolvedValue({ id: "00000000-0000-0000-0000-000000000001" });
  });

  it("returns 400 when code is missing", async () => {
    const response = await POST(makePostRequest({ refereeId: "00000000-0000-0000-0000-000000000001" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Données manquantes");
  });

  it("returns 400 when refereeId is missing", async () => {
    const response = await POST(makePostRequest({ code: "ABCD1234" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Données manquantes");
  });

  it("returns 400 when code format is invalid (too short)", async () => {
    const response = await POST(makePostRequest({
      code: "ABC",
      refereeId: "00000000-0000-0000-0000-000000000001",
    }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Code invalide");
  });

  it("returns 400 when code format is invalid (special chars)", async () => {
    const response = await POST(makePostRequest({
      code: "ABCD!@#$",
      refereeId: "00000000-0000-0000-0000-000000000001",
    }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Code invalide");
  });

  it("returns 400 when refereeId is not a valid UUID", async () => {
    // Override auth to match the invalid refereeId so the 403 check passes
    mockGetAuthenticatedUser.mockResolvedValue({ id: "not-a-uuid" });
    const response = await POST(makePostRequest({
      code: "ABCD1234",
      refereeId: "not-a-uuid",
    }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Données invalides");
  });

  it("returns 400 when code is not a string", async () => {
    const response = await POST(makePostRequest({
      code: 12345678,
      refereeId: "00000000-0000-0000-0000-000000000001",
    }));
    expect(response.status).toBe(400);
  });

  it("returns 404 when referee user does not exist", async () => {
    // 1st maybeSingle: referee lookup returns null
    maybeSingleResults = [null];

    const response = await POST(makePostRequest({
      code: "ABCD1234",
      refereeId: "00000000-0000-0000-0000-000000000001",
    }));
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Utilisateur introuvable");
  });

  it("returns 404 when referral code does not exist", async () => {
    // 1st: referee exists, 2nd: referrer not found
    maybeSingleResults = [
      { id: "00000000-0000-0000-0000-000000000001" },
      null,
    ];

    const response = await POST(makePostRequest({
      code: "ZZZZ9999",
      refereeId: "00000000-0000-0000-0000-000000000001",
    }));
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Code invalide");
  });

  it("returns 403 when user tries self-referral", async () => {
    const userId = "00000000-0000-0000-0000-000000000001";
    // 1st: referee exists, 2nd: referrer is same user
    maybeSingleResults = [
      { id: userId },
      { id: userId, plan: "pro" },
    ];

    const response = await POST(makePostRequest({
      code: "ABCD1234",
      refereeId: userId,
    }));
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Auto-parrainage interdit");
  });

  it("returns 403 when referrer is on Free plan", async () => {
    // 1st: referee exists, 2nd: referrer on free plan
    maybeSingleResults = [
      { id: "00000000-0000-0000-0000-000000000001" },
      { id: "00000000-0000-0000-0000-000000000002", plan: "free" },
    ];

    const response = await POST(makePostRequest({
      code: "ABCD1234",
      refereeId: "00000000-0000-0000-0000-000000000001",
    }));
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Parrain non éligible");
  });

  it("returns 429 when referrer has reached monthly limit", async () => {
    // 1st: referee, 2nd: referrer
    maybeSingleResults = [
      { id: "00000000-0000-0000-0000-000000000001" },
      { id: "00000000-0000-0000-0000-000000000002", plan: "pro" },
    ];
    countResult = { count: 3 };

    const response = await POST(makePostRequest({
      code: "ABCD1234",
      refereeId: "00000000-0000-0000-0000-000000000001",
    }));
    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toBe("Limite de parrainages atteinte ce mois");
  });

  it("returns 409 when referee is already referred", async () => {
    // 1st: referee, 2nd: referrer, 3rd: existing referral found
    maybeSingleResults = [
      { id: "00000000-0000-0000-0000-000000000001" },
      { id: "00000000-0000-0000-0000-000000000002", plan: "pro" },
      { id: "existing-referral" },
    ];
    countResult = { count: 0 };

    const response = await POST(makePostRequest({
      code: "ABCD1234",
      refereeId: "00000000-0000-0000-0000-000000000001",
    }));
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toBe("Déjà parrainé");
  });

  it("creates referral successfully when all conditions are met", async () => {
    // 1st: referee, 2nd: referrer, 3rd: no existing referral
    maybeSingleResults = [
      { id: "00000000-0000-0000-0000-000000000001" },
      { id: "00000000-0000-0000-0000-000000000002", plan: "business" },
      null,
    ];
    countResult = { count: 1 };
    insertResult = { error: null };

    const response = await POST(makePostRequest({
      code: "ABCD1234",
      refereeId: "00000000-0000-0000-0000-000000000001",
    }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.referrerId).toBe("00000000-0000-0000-0000-000000000002");

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        referrer_id: "00000000-0000-0000-0000-000000000002",
        referee_id: "00000000-0000-0000-0000-000000000001",
        code: "ABCD1234",
        status: "pending",
      })
    );
  });

  it("returns 500 when insert fails", async () => {
    maybeSingleResults = [
      { id: "00000000-0000-0000-0000-000000000001" },
      { id: "00000000-0000-0000-0000-000000000002", plan: "pro" },
      null,
    ];
    countResult = { count: 0 };
    insertResult = { error: { message: "DB error" } };

    const response = await POST(makePostRequest({
      code: "ABCD1234",
      refereeId: "00000000-0000-0000-0000-000000000001",
    }));
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Erreur lors de l'enregistrement");
  });
});
