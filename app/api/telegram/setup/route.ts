/**
 * Setup endpoint - Enregistre le webhook Telegram.
 * Appeler une seule fois : GET /api/telegram/setup
 *
 * Construit l'URL du webhook a partir de NEXT_PUBLIC_APP_URL ou VERCEL_URL,
 * et ajoute le secret en query param pour la verification.
 */

import { NextResponse } from "next/server";
import { setTelegramWebhook } from "@/lib/telegram-bot";

export async function GET(): Promise<Response> {
  try {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "TELEGRAM_WEBHOOK_SECRET manquant" },
        { status: 500 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN manquant" },
        { status: 500 }
      );
    }

    // Determiner l'URL de base de l'app
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

    if (!appUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_APP_URL ou VERCEL_URL requis" },
        { status: 500 }
      );
    }

    const webhookUrl = `${appUrl}/api/telegram/webhook?secret=${encodeURIComponent(secret)}`;

    const result = await setTelegramWebhook(webhookUrl);

    return NextResponse.json({
      success: true,
      webhookUrl: webhookUrl.replace(secret, "***"),
      telegramResponse: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
