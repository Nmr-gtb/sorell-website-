/**
 * Setup endpoint — Enregistre les webhooks Telegram pour tous les bots.
 * GET /api/telegram/setup         → setup tous les bots
 * GET /api/telegram/setup?bot=eva → setup un bot spécifique
 * GET /api/telegram/setup?bot=jade
 */

import { NextResponse } from "next/server";
import {
  setTelegramWebhook,
  getBotToken,
  getBotSecret,
  getBotWebhookPath,
} from "@/lib/telegram-bot";
import type { BotName } from "@/lib/telegram-bot";

const ALL_BOTS: BotName[] = ["eva", "jade"];

async function setupBot(bot: BotName, appUrl: string): Promise<{
  bot: string;
  success: boolean;
  webhookUrl?: string;
  error?: string;
}> {
  try {
    const token = getBotToken(bot);
    const secret = getBotSecret(bot);
    const path = getBotWebhookPath(bot);

    const webhookUrl = `${appUrl}${path}?secret=${encodeURIComponent(secret)}`;

    await setTelegramWebhook(webhookUrl, token);

    return {
      bot,
      success: true,
      webhookUrl: webhookUrl.replace(secret, "***"),
    };
  } catch (error) {
    return {
      bot,
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const botParam = url.searchParams.get("bot") as BotName | null;

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

    if (!appUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_APP_URL ou VERCEL_URL requis" },
        { status: 500 }
      );
    }

    // Setup un bot spécifique ou tous
    const botsToSetup = botParam ? [botParam] : ALL_BOTS;

    // Vérifier que le bot demandé est valide
    for (const bot of botsToSetup) {
      if (!ALL_BOTS.includes(bot)) {
        return NextResponse.json(
          { error: `Bot inconnu: ${bot}. Bots disponibles: ${ALL_BOTS.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const results = await Promise.all(
      botsToSetup.map((bot) => setupBot(bot, appUrl))
    );

    return NextResponse.json({
      results,
      allSuccess: results.every((r) => r.success),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
