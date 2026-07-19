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

        // Activity log pour chaque propriétaire concerné
        if (recipients && recipients.length > 0) {
          for (const recipient of recipients) {
            // Récupérer le profil du propriétaire
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("email, full_name")
              .eq("id", recipient.user_id)
              .single();

            void logBounce(recipient.user_id, profile?.email || "", bouncedEmail);
          }
        } else {
          // Pas de destinataire trouvé (déjà supprimé ou email direct)
          void logBounce("", "", bouncedEmail);
        }
      }
    }

    // Tracking des ouvertures / clics / livraisons pour les newsletters.
    // Necessaire au declencheur lifecycle retention_unopened_5nl.
    // Attribution : l'id interne voyage dans les tags Resend posés à l'envoi
    // (lib/send-newsletter-batch). Fallback pour les emails partis avant les
    // tags : matching par subject SCOPÉ aux comptes dont ce destinataire fait
    // partie — et si plusieurs newsletters restent candidates, on n'insère
    // rien plutôt que d'attribuer l'événement au mauvais utilisateur.
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

      // Les tags arrivent en objet plat {name: value} dans les payloads
      // webhook Resend (mais en tableau [{name, value}] côté API d'envoi) :
      // on tolère les deux formes.
      const rawTags = (data as { tags?: unknown })?.tags;
      let taggedNewsletterId: string | null = null;
      if (Array.isArray(rawTags)) {
        const found = (rawTags as Array<{ name?: string; value?: string }>).find(
          (t) => t?.name === "newsletter_id"
        );
        taggedNewsletterId = found?.value || null;
      } else if (rawTags && typeof rawTags === "object") {
        const value = (rawTags as Record<string, unknown>).newsletter_id;
        taggedNewsletterId = typeof value === "string" ? value : null;
      }

      let newsletterId: string | null = null;

      if (taggedNewsletterId) {
        // Attribution directe par tag : vérifier que la newsletter existe
        // (protège des tags forgés ou obsolètes).
        const { data: tagged } = await supabaseAdmin
          .from("newsletters")
          .select("id")
          .eq("id", taggedNewsletterId)
          .maybeSingle();
        newsletterId = tagged?.id || null;
      } else if (recipientEmail && subject) {
        // Fallback (emails envoyés avant les tags) : scoper la recherche aux
        // utilisateurs dont ce destinataire fait partie, jamais en global.
        const { data: ownerRows } = await supabaseAdmin
          .from("recipients")
          .select("user_id")
          .eq("email", recipientEmail);

        const ownerIds = [...new Set((ownerRows || []).map((r) => r.user_id))];
        if (ownerIds.length > 0) {
          const { data: candidates } = await supabaseAdmin
            .from("newsletters")
            .select("id")
            .eq("subject", subject)
            .in("user_id", ownerIds)
            .not("sent_at", "is", null)
            .order("sent_at", { ascending: false })
            .limit(2);

          // Une seule candidate : attribution sûre. Plusieurs : ambigu, on
          // laisse tomber l'événement plutôt que de deviner.
          if (candidates?.length === 1) {
            newsletterId = candidates[0].id;
          }
        }
      }

      if (newsletterId && recipientEmail) {
        // Insertion silencieuse : on tolere les doublons (Resend peut
        // renvoyer plusieurs evenements pour la meme ouverture).
        await supabaseAdmin.from("newsletter_events").insert({
          newsletter_id: newsletterId,
          recipient_email: recipientEmail,
          event_type: eventType,
        });
      }
    }
  } catch {
    return NextResponse.json({ error: "Erreur de traitement du webhook." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
