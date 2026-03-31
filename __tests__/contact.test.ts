import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("resend", () => {
  const mockSend = vi.fn().mockResolvedValue({ id: "email-123" });
  return {
    Resend: class {
      emails = { send: mockSend };
    },
    __mockSend: mockSend,
  };
});

import { POST } from "@/app/api/contact/route";
import * as resendModule from "resend";

const mockSend = (resendModule as unknown as { __mockSend: ReturnType<typeof vi.fn> }).__mockSend;

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ id: "email-123" });
  });

  it("returns 400 when name is missing", async () => {
    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", message: "Hello" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when email is missing", async () => {
    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "John", message: "Hello" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when message is missing", async () => {
    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "John", email: "test@example.com" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("sends 2 emails and returns success for valid input", async () => {
    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "John",
        email: "john@example.com",
        subject: "Question",
        message: "Hello Sorell!",
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(2);
  });
});
