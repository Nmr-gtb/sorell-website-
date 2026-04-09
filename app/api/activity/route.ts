/**
 * API Activity - Endpoint pour logger les changements de config depuis le client.
 * POST /api/activity
 * Body: { type: "changement_config", field: string, details?: string }
 */

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { logConfigChange, logRecipientAdded, logRecipientRemoved } from "@/lib/activity-log";

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const body = await request.json();
    const { type, field, details, recipientEmail } = body as {
      type: string;
      field: string;
      details?: string;
      recipientEmail?: string;
    };

    if (!type || !field) {
      return NextResponse.json({ error: "Parametres manquants" }, { status: 400 });
    }

    switch (type) {
      case "changement_config":
        void logConfigChange(user.id, user.email ?? "", field, details);
        break;
      case "ajout_destinataire":
        void logRecipientAdded(user.id, user.email ?? "", recipientEmail ?? field);
        break;
      case "suppression_destinataire":
        void logRecipientRemoved(user.id, user.email ?? "", recipientEmail ?? field);
        break;
      default:
        return NextResponse.json({ error: "Type inconnu" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
