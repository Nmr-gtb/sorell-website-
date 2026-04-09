/**
 * Webhook Vercel — Jade lance un fullreview après chaque déploiement.
 *
 * À configurer dans Vercel : Settings → Webhooks → Add
 * URL : https://www.sorell.fr/api/webhooks/vercel
 * Events : deployment.succeeded, deployment.error
 */

import { NextResponse } from "next/server";
import { sendTelegramMessage, getBotToken } from "@/lib/telegram-bot";
import { runFullReview } from "@/lib/eva-monitor";

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
    const body = (await request.json()) as VercelWebhookPayload;
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
