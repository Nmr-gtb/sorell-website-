import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: vi.fn() };
  },
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: vi.fn() };
  },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        not: vi.fn().mockResolvedValue({ data: [], error: null }),
        in: vi.fn().mockResolvedValue({ data: [] }),
      }),
    }),
  }),
}));

import { GET } from "@/app/api/cron/route";

describe("GET /api/cron - Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    process.env.ANTHROPIC_API_KEY = "test-key";
    process.env.RESEND_API_KEY = "test-key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("returns 401 when no Authorization header", async () => {
    const request = new Request("http://localhost/api/cron", {
      headers: {},
    });
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns 401 when Authorization header has wrong secret", async () => {
    const request = new Request("http://localhost/api/cron", {
      headers: { Authorization: "Bearer wrong-secret" },
    });
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns 500 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;

    const request = new Request("http://localhost/api/cron", {
      headers: { Authorization: "Bearer any-token" },
    });
    const response = await GET(request);
    expect(response.status).toBe(500);
  });

  it("accepts request with correct Bearer token", async () => {
    const request = new Request("http://localhost/api/cron", {
      headers: { Authorization: "Bearer test-cron-secret" },
    });
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("No configs to process");
  });
});
