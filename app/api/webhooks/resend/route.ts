import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createHmac, timingSafeEqual } from "crypto";
import { logBounce } from "@/lib/activity-log";

function verifyWebhookSignature(
  body: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string
): boolean {
  // Svix secret is base64-encoded, prefixed with "whsec_"
  const secretBytes = Buffer.from(
    secret.startsWith("whsec_") ? secret.slice(6) : secret,
    "base64"
  );

  // Verify timestamp is not too old (5 minutes tolerance)
  const timestampSeconds = parseInt(svixTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(timestampSeconds) || Math.abs(now - timestampSeconds) > 300) {
    return false;
  }

  // Compute expected signature: HMAC-SHA256 of "msgId.timestamp.body"
  const signedContent = `${svixId}.${svixTimestamp}.${body}`;
  const expectedSignature = createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  // svix-signature header contains comma-separated "v1,<sig>" entries
  const signatures = svixSignature.split(" ");
  for (const sig of signatures) {
    const [version, value] = sig.split(",");
    if (version === "v1" && value) {
      try {
        const expectedBuf = Buffer.from(expectedSignature);
        const receivedBuf = Buffer.from(value);
        if (expectedBuf.length === receivedBuf.length && timingSafeEqual(expectedBuf, receivedBuf)) {
          return true;
        }
      } catch {
        continue;
      }
    }
  }
  return false;
}

export async function POST(request: Request) {
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing headers" }, { status: 400 });
  }

  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!verifyWebhookSignature(rawBody, svixId, svixTimestamp, svixSignature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, data } = body;

  try {
    if (type === "email.bounced" || type === "email.complained") {
      const bouncedEmail = data?.to?.[0];
      if (bouncedEmail) {
        // Remove bounced email from recipients table
        await supabaseAdmin
          .from("recipients")
          .delete()
          .eq("email", bouncedEmail);

        // Activity log - userId not available in webhook context
        void logBounce("", "", bouncedEmail);
      }
    }
  } catch {
    return NextResponse.json({ error: "Erreur de traitement du webhook." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
