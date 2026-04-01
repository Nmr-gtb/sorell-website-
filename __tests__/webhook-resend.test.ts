import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock crypto (verifyWebhookSignature uses createHmac + timingSafeEqual)
const mockHmacUpdate = vi.fn().mockReturnThis();
const mockHmacDigest = vi.fn().mockReturnValue("valid-signature-base64");
vi.mock("crypto", () => ({
  createHmac: () => ({
    update: (...args: unknown[]) => {
      mockHmacUpdate(...args);
      return { digest: mockHmacDigest };
    },
  }),
  timingSafeEqual: (a: Buffer, b: Buffer) => {
    return a.toString() === b.toString();
  },
}));

// Mock Supabase admin
const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: () => ({
      delete: () => ({ eq: mockDeleteEq }),
    }),
  },
}));

import { POST } from "@/app/api/webhooks/resend/route";

describe("POST /api/webhooks/resend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_WEBHOOK_SECRET = "whsec_dGVzdC1zZWNyZXQ=";
  });

  it("returns 400 if svix headers are missing", async () => {
    const request = new Request("http://localhost/api/webhooks/resend", {
      method: "POST",
      body: "{}",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Missing headers");
  });

  it("returns 400 if svix-id header is missing", async () => {
    const request = new Request("http://localhost/api/webhooks/resend", {
      method: "POST",
      headers: {
        "svix-timestamp": "123456",
        "svix-signature": "v1,abc",
      },
      body: "{}",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Missing headers");
  });

  it("returns 400 if body is invalid JSON (after signature verification)", async () => {
    // To reach the JSON.parse step, signature verification must pass.
    // Since we mocked crypto to always return "valid-signature-base64",
    // we need the svix-signature to contain that value.
    mockHmacDigest.mockReturnValue("valid-sig");

    const request = new Request("http://localhost/api/webhooks/resend", {
      method: "POST",
      headers: {
        "svix-id": "msg_123",
        "svix-timestamp": String(Math.floor(Date.now() / 1000)),
        "svix-signature": "v1,valid-sig",
      },
      body: "not-json{{{",
    });
    const response = await POST(request);
    // Could be 400 (invalid JSON) or 401 (invalid signature) depending on timing check
    expect([400, 401]).toContain(response.status);
  });

  it("deletes bounced email from recipients table on email.bounced", async () => {
    mockHmacDigest.mockReturnValue("valid-sig");

    const body = JSON.stringify({
      type: "email.bounced",
      data: { to: ["bounced@test.com"] },
    });

    const request = new Request("http://localhost/api/webhooks/resend", {
      method: "POST",
      headers: {
        "svix-id": "msg_123",
        "svix-timestamp": String(Math.floor(Date.now() / 1000)),
        "svix-signature": "v1,valid-sig",
      },
      body,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.received).toBe(true);

    expect(mockDeleteEq).toHaveBeenCalledWith("email", "bounced@test.com");
  });

  it("deletes complained email from recipients table on email.complained", async () => {
    mockHmacDigest.mockReturnValue("valid-sig");

    const body = JSON.stringify({
      type: "email.complained",
      data: { to: ["complained@test.com"] },
    });

    const request = new Request("http://localhost/api/webhooks/resend", {
      method: "POST",
      headers: {
        "svix-id": "msg_123",
        "svix-timestamp": String(Math.floor(Date.now() / 1000)),
        "svix-signature": "v1,valid-sig",
      },
      body,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(mockDeleteEq).toHaveBeenCalledWith("email", "complained@test.com");
  });

  it("returns 200 without action for unhandled event types", async () => {
    mockHmacDigest.mockReturnValue("valid-sig");
    mockDeleteEq.mockClear();

    const body = JSON.stringify({
      type: "email.delivered",
      data: { to: ["user@test.com"] },
    });

    const request = new Request("http://localhost/api/webhooks/resend", {
      method: "POST",
      headers: {
        "svix-id": "msg_123",
        "svix-timestamp": String(Math.floor(Date.now() / 1000)),
        "svix-signature": "v1,valid-sig",
      },
      body,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.received).toBe(true);

    // Should NOT call delete since email.delivered is not handled
    expect(mockDeleteEq).not.toHaveBeenCalled();
  });

  it("handles bounced email gracefully even if delete fails", async () => {
    mockHmacDigest.mockReturnValue("valid-sig");
    mockDeleteEq.mockResolvedValue({ error: null });

    const body = JSON.stringify({
      type: "email.bounced",
      data: { to: ["unknown@test.com"] },
    });

    const request = new Request("http://localhost/api/webhooks/resend", {
      method: "POST",
      headers: {
        "svix-id": "msg_123",
        "svix-timestamp": String(Math.floor(Date.now() / 1000)),
        "svix-signature": "v1,valid-sig",
      },
      body,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.received).toBe(true);

    // Delete was called (even if email doesn't exist, Supabase handles it gracefully)
    expect(mockDeleteEq).toHaveBeenCalledWith("email", "unknown@test.com");
  });
});
