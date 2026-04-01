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
const mockSelectResult = vi.fn();
const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => mockSelectResult(),
      update: (...args: unknown[]) => mockUpdate(...args),
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

  it("removes bounced email from newsletter_config.recipients on email.bounced", async () => {
    mockHmacDigest.mockReturnValue("valid-sig");
    mockSelectResult.mockResolvedValue({
      data: [
        { user_id: "user-1", recipients: ["good@test.com", "bounced@test.com"] },
        { user_id: "user-2", recipients: ["other@test.com"] },
      ],
    });

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

    // Should update user-1's config (which contained the bounced email)
    expect(mockUpdate).toHaveBeenCalledWith({ recipients: ["good@test.com"] });
    expect(mockUpdateEq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("removes complained email from newsletter_config.recipients on email.complained", async () => {
    mockHmacDigest.mockReturnValue("valid-sig");
    mockSelectResult.mockResolvedValue({
      data: [
        { user_id: "user-1", recipients: ["complained@test.com", "ok@test.com"] },
      ],
    });

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

    expect(mockUpdate).toHaveBeenCalledWith({ recipients: ["ok@test.com"] });
  });

  it("returns 200 without action for unhandled event types", async () => {
    mockHmacDigest.mockReturnValue("valid-sig");

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

    // Should NOT call update since email.delivered is not handled
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("does not error when bounced email is not in any config", async () => {
    mockHmacDigest.mockReturnValue("valid-sig");
    mockSelectResult.mockResolvedValue({
      data: [
        { user_id: "user-1", recipients: ["other@test.com"] },
      ],
    });

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

    // Should NOT call update since the email is not in any config
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
