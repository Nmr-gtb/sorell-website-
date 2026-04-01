import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing headers" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { type, data } = body;

  if (type === "email.bounced" || type === "email.complained") {
    const bouncedEmail = data?.to?.[0];
    if (bouncedEmail) {
      // Retirer l'email des destinataires de toutes les configs
      const { data: configs } = await supabaseAdmin
        .from("newsletter_config")
        .select("user_id, recipients");

      if (configs) {
        for (const config of configs) {
          const recipients = config.recipients as string[] | null;
          if (recipients?.includes(bouncedEmail)) {
            const updated = recipients.filter((r: string) => r !== bouncedEmail);
            await supabaseAdmin
              .from("newsletter_config")
              .update({ recipients: updated })
              .eq("user_id", config.user_id);
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
