import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createHmac, timingSafeEqual } from "crypto";
import { logBounce } from "@/lib/activity-log";
import { notifyBounce } from "@/lib/eva-notifications";

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

      // Ne pas supprimer sur un bounce TEMPORAIRE (Transient : boîte pleine,
      // serveur indisponible...) : ce serait détruire la donnée d'un abonné
      // valide. On ne supprime que sur hard bounce (Permanent), plainte spam
      // (email.complained), ou bounce dont le type n'est pas précisé.
      const bounceType = (data as { bounce?: { type?: string } })?.bounce?.type;
      const isSoftBounce = type === "email.bounced" && bounceType === "Transient";
      if (isSoftBounce) {
        return NextResponse.json({ received: true, skipped: "soft_bounce" });
      }

      if (bouncedEmail) {
        // Chercher le destinataire et son propriétaire avant suppression
        const { data: recipients } = await supabaseAdmin
          .from("recipients")
          .select("user_id, name, email")
          .eq("email", bouncedEmail);

        // Supprimer le destinataire de toutes les listes
        await supabaseAdmin
          .from("recipients")
          .delete()
          .eq("email", bouncedEmail);

        // Notifier Eva + activity log pour chaque propriétaire concerné
        if (recipients && recipients.length > 0) {
          for (const recipient of recipients) {
            // Récupérer le profil du propriétaire
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("email, full_name")
              .eq("id", recipient.user_id)
              .single();

            const ownerEmail = profile?.email || "";
            const ownerName = profile?.full_name || "";

            void logBounce(recipient.user_id, ownerEmail, bouncedEmail);
            void notifyBounce(bouncedEmail, recipient.name || "", ownerName, ownerEmail);
          }
        } else {
          // Pas de destinataire trouvé (déjà supprimé ou email direct)
          void logBounce("", "", bouncedEmail);
          void notifyBounce(bouncedEmail, "", "", "");
        }
      }
    }

    // Tracking des ouvertures / clics / livraisons pour les newsletters.
    // Necessaire au declencheur lifecycle retention_unopened_5nl.
    // Resend identifie chaque newsletter via la table newsletters : on
    // remonte le newsletter_id en cherchant le subject + le destinataire
    // dans l'historique (Resend ne renvoie pas notre id interne).
    if (
      type === "email.opened" ||
      type === "email.clicked" ||
      type === "email.delivered"
    ) {
      const eventType =
        type === "email.opened"
          ? "opened"
          : type === "email.clicked"
            ? "clicked"
            : "delivered";

      const recipientEmail = data?.to?.[0];
      const subject = data?.subject;

      if (recipientEmail && subject) {
        // Retrouver la newsletter correspondante (la plus recente envoyee
        // a ce destinataire avec ce subject).
        const { data: matchedNewsletter } = await supabaseAdmin
          .from("newsletters")
          .select("id")
          .eq("subject", subject)
          .not("sent_at", "is", null)
          .order("sent_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (matchedNewsletter?.id) {
          // Insertion silencieuse : on tolere les doublons (Resend peut
          // renvoyer plusieurs evenements pour la meme ouverture).
          await supabaseAdmin.from("newsletter_events").insert({
            newsletter_id: matchedNewsletter.id,
            recipient_email: recipientEmail,
            event_type: eventType,
          });
        }
      }
    }
  } catch {
    return NextResponse.json({ error: "Erreur de traitement du webhook." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
