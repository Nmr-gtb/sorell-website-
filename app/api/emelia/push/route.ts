/**
 * POST /api/emelia/push — Pousse les contacts Notion "À envoyer" vers Emelia.
 *
 * Auth : CRON_SECRET (query param ou Bearer header).
 * Body optionnel : { campaignId: "..." } — sinon utilise la première campagne autorisée.
 *
 * Peut être appelé :
 * - Manuellement via curl/Postman
 * - Par Eva (bot Telegram) quand Noé dit "pousse les contacts"
 * - Par un CRON si besoin
 */

import { NextResponse } from "next/server";
import { pushNotionToEmelia, pushNotionToDefaultCampaign } from "@/lib/notion-to-emelia";
import { verifyCronSecret } from "@/lib/auth";

export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    let campaignId: string | undefined;

    try {
      const body = (await request.json()) as { campaignId?: string };
      campaignId = body.campaignId;
    } catch {
      // Body vide ou invalide — on utilise la campagne par défaut
    }

    const result = campaignId
      ? await pushNotionToEmelia(campaignId)
      : await pushNotionToDefaultCampaign();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    // Erreur loggée côté serveur, message générique au client (pas de détail technique).
    console.error("[emelia/push]", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
