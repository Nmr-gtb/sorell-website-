/**
 * Webhook Vercel — Jade lance un fullreview après chaque déploiement.
 *
 * À configurer dans Vercel : Settings → Webhooks → Add
 * URL : https://www.sorell.fr/api/webhooks/vercel
 * Events : deployment.succeeded, deployment.error
 */

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { sendTelegramMessage, getBotToken } from "@/lib/telegram-bot";
import { runFullReview } from "@/lib/eva-monitor";

// Vérifie la signature Vercel (HMAC-SHA1 du corps brut avec VERCEL_WEBHOOK_SECRET,
// en-tête x-vercel-signature). Fail-close : sans secret configuré, on refuse.
function verifyVercelSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.VERCEL_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha1", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface VercelWebhookPayload {
  type: string;
  payload: {
    deployment: {
      id: string;
      url: string;
      meta?: {
        githubCommitMessage?: string;
        githubCommitSha?: string;
      };
    };
  };
}

function getChatId(): number {
  const id = process.env.TELEGRAM_USER_ID;
  if (!id) throw new Error("TELEGRAM_USER_ID manquant");
  return parseInt(id, 10);
}

export async function POST(request: Request): Promise<Response> {
  try {
    // Lire le corps brut pour vérifier la signature AVANT tout traitement
    // (empêche un tiers de déclencher un runFullReview coûteux + des messages Telegram).
    const rawBody = await request.text();
    if (!verifyVercelSignature(rawBody, request.headers.get("x-vercel-signature"))) {
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }

    const body = JSON.parse(rawBody) as VercelWebhookPayload;
    const jadeToken = getBotToken("jade");
    const chatId = getChatId();

    const commitMsg = body.payload?.deployment?.meta?.githubCommitMessage ?? "Pas de message";
    const shortCommit = commitMsg.split("\n")[0].slice(0, 80);

    if (body.type === "deployment.succeeded") {
      // Prévenir que le check commence
      await sendTelegramMessage({
        chatId,
        text: `Nouveau déploiement détecté !\n<i>${shortCommit}</i>\n\nJe lance un check complet...`,
        botToken: jadeToken,
      });

      // Lancer le fullreview
      const report = await runFullReview();

      await sendTelegramMessage({
        chatId,
        text: report,
        botToken: jadeToken,
      });

      return NextResponse.json({ ok: true, action: "fullreview_sent" });
    }

    if (body.type === "deployment.error") {
      await sendTelegramMessage({
        chatId,
        text: `⚠️ <b>Déploiement échoué !</b>\n\n<i>${shortCommit}</i>\n\nVérifie les logs sur Vercel.`,
        botToken: jadeToken,
      });

      return NextResponse.json({ ok: true, action: "error_alert_sent" });
    }

    // Ignorer les autres events
    return NextResponse.json({ ok: true, action: "ignored" });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
