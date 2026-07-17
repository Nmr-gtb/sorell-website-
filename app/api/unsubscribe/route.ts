import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

/**
 * Retire un destinataire. Si uid est fourni, la suppression est limitée à la
 * liste de CE client (le propriétaire de la newsletter) ; sinon, retrait de
 * toutes les listes (compat rétro pour les anciens liens sans uid).
 * Retourne true si le token est valide et la suppression tentée.
 */
async function processUnsubscribe(
  email: string | null,
  token: string | null,
  userId: string | null
): Promise<boolean> {
  if (!email || !token || !verifyUnsubscribeToken(email, token)) return false;
  if (userId) {
    await supabase.from("recipients").delete().eq("email", email).eq("user_id", userId);
  } else {
    await supabase.from("recipients").delete().eq("email", email);
  }
  return true;
}

// GET : clic humain sur le lien "Se désabonner" -> redirection vers la page de confirmation.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const userId = searchParams.get("uid");

  try {
    const ok = await processUnsubscribe(email, token, userId);
    if (!ok) {
      return NextResponse.redirect(new URL("/desabonnement?status=error", request.url));
    }
    return NextResponse.redirect(
      new URL("/desabonnement?status=success&email=" + encodeURIComponent(email || ""), request.url)
    );
  } catch {
    return NextResponse.redirect(new URL("/desabonnement?status=error", request.url));
  }
}

// POST : one-click List-Unsubscribe (RFC 8058). Gmail/Yahoo POSTent à cette URL
// avec le body "List-Unsubscribe=One-Click". Les paramètres (email/token/uid)
// restent dans la query string de l'URI. Réponse machine-to-machine, pas de redirect.
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const userId = searchParams.get("uid");

  try {
    const ok = await processUnsubscribe(email, token, userId);
    // On répond 200 même si le token est invalide : ne pas divulguer l'info au
    // client mail, et éviter qu'il ne réessaie en boucle.
    return NextResponse.json({ unsubscribed: ok }, { status: 200 });
  } catch {
    return NextResponse.json({ unsubscribed: false }, { status: 200 });
  }
}
