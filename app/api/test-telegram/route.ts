/**
 * Route de test temporaire — Envoie un faux rappel planning via Eva.
 * À SUPPRIMER après le test.
 *
 * GET /api/test-telegram?secret=CRON_SECRET
 */

import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram-bot";

export const maxDuration = 30;

export async function GET(request: Request): Promise<NextResponse> {
  // Auth via query param ou Bearer header
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const authHeader = request.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (secret !== process.env.CRON_SECRET && bearerSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const chatId = process.env.TELEGRAM_USER_ID;
  if (!chatId) {
    return NextResponse.json({ error: "TELEGRAM_USER_ID manquant" }, { status: 500 });
  }

  try {
    // Simule un rappel 24h avant
    const reminder24h =
      `🔔 <b>Rappel Planning</b>\n\n` +
      `📅 <b>Demain</b> (LinkedIn)\n` +
      `Post pro Sorell — offre 5 places gratuites (LANCEMENT5)\n` +
      `Prévu le lundi 13 avril`;

    await sendTelegramMessage({ chatId, text: reminder24h });

    // Simule un rappel 1h avant
    const reminder1h =
      `🔔 <b>Rappel Planning</b>\n\n` +
      `⏰ <b>Dans 1 heure</b> (LinkedIn)\n` +
      `Post pro Sorell — offre 5 places gratuites (LANCEMENT5)`;

    await sendTelegramMessage({ chatId, text: reminder1h });

    // Simule un rappel "c'est maintenant"
    const reminderNow =
      `🔔 <b>Rappel Planning</b>\n\n` +
      `🚀 <b>C'est maintenant !</b> (LinkedIn)\n` +
      `Post pro Sorell — offre 5 places gratuites (LANCEMENT5)`;

    await sendTelegramMessage({ chatId, text: reminderNow });

    return NextResponse.json({
      success: true,
      message: "3 messages de test envoyés (24h, 1h, maintenant)",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
