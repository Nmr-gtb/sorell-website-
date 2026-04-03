import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Resend
vi.mock("resend", () => {
  const mockSend = vi.fn();
  return {
    Resend: class {
      emails = { send: mockSend };
    },
    __mockSend: mockSend,
  };
});

// Mock Supabase admin
vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === "profiles") {
        const emptyData = { data: [] };
        const chainable: Record<string, unknown> = {};
        // Make it thenable so it works as both a promise and a chainable
        chainable.then = (resolve: (v: unknown) => unknown) => Promise.resolve(emptyData).then(resolve);
        chainable.catch = (reject: (v: unknown) => unknown) => Promise.resolve(emptyData).catch(reject);
        chainable.in = () => Promise.resolve(emptyData);
        chainable.lte = () => {
          const sub: Record<string, unknown> = {};
          sub.then = (resolve: (v: unknown) => unknown) => Promise.resolve(emptyData).then(resolve);
          sub.catch = (reject: (v: unknown) => unknown) => Promise.resolve(emptyData).catch(reject);
          sub.in = () => Promise.resolve(emptyData);
          return sub;
        };
        return {
          select: () => ({
            gte: () => chainable,
            not: () => ({
              in: () => Promise.resolve(emptyData),
            }),
            in: () => Promise.resolve(emptyData),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === "newsletter_config") {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [] }),
          }),
        };
      }
      if (table === "lifecycle_emails") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: null }),
              }),
            }),
          }),
          upsert: () => Promise.resolve({ error: null }),
        };
      }
      if (table === "newsletters") {
        return {
          select: (...args: unknown[]) => {
            // count query: .select("id", { count: "exact", head: true })
            if (args.length > 1) {
              return {
                eq: () => ({
                  gte: () => ({
                    not: () => Promise.resolve({ count: 0 }),
                  }),
                }),
              };
            }
            // regular select for section 6: .select().gte().is()
            return {
              eq: () => ({
                eq: () => ({
                  gte: () => ({
                    not: () => Promise.resolve({ count: 0 }),
                  }),
                }),
              }),
              gte: () => ({
                is: () => Promise.resolve({ data: [] }),
              }),
            };
          },
        };
      }
      return {
        select: () => ({ eq: () => Promise.resolve({ data: [] }) }),
      };
    },
  },
}));

import { GET } from "@/app/api/cron/lifecycle/route";

describe("GET /api/cron/lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    process.env.RESEND_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  });

  it("returns 401 when no Authorization header", async () => {
    const request = new Request("http://localhost/api/cron/lifecycle", {
      headers: {},
    });
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns 401 when Authorization header has wrong secret", async () => {
    const request = new Request("http://localhost/api/cron/lifecycle", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns 401 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;

    const request = new Request("http://localhost/api/cron/lifecycle", {
      headers: { authorization: "Bearer any-token" },
    });
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns success with results object when authenticated", async () => {
    const request = new Request("http://localhost/api/cron/lifecycle", {
      headers: { authorization: "Bearer test-cron-secret" },
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.results).toBeDefined();
    expect(data.results.onboarding_j1).toBe(0);
    expect(data.results.trial_j3).toBe(0);
    expect(data.results.trial_j1).toBe(0);
    expect(data.results.trial_j0).toBe(0);
    expect(data.results.limit_reached).toBe(0);
    expect(data.results.errors).toBe(0);
    expect(data.timestamp).toBeDefined();
  });
});
