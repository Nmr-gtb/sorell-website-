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

export const maxDuration = 60;

function verifySecret(request: Request): boolean {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const authHeader = request.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  return (
    secret === process.env.CRON_SECRET ||
    bearerSecret === process.env.CRON_SECRET
  );
}

export async function POST(request: Request): Promise<Response> {
  if (!verifySecret(request)) {
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
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
