import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { logEmailClick } from "@/lib/activity-log";
import { verifyClickToken } from "@/lib/tracking-token";

const FALLBACK_URL = "https://sorell.fr";

// N'autoriser que des URL https bien formées (bloque javascript:, data:, etc.).
function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nid = searchParams.get("nid");
  const email = searchParams.get("email");
  const url = searchParams.get("url");
  const article = searchParams.get("article");
  const sig = searchParams.get("sig");

  // Redirection uniquement vers une URL https signée pour ce (nid, email).
  // La signature couvre l'url : impossible de la détourner (open redirect) ni
  // de forger un clic. Sans signature valide → retour à l'accueil, aucun
  // enregistrement (protège aussi les analytics contre la falsification).
  const isTrusted =
    !!nid && !!email && !!url && isHttpsUrl(url) && verifyClickToken(nid, email, url, sig);

  const safeUrl = isTrusted ? (url as string) : FALLBACK_URL;

  if (isTrusted) {
    try {
      await supabase.from("newsletter_events").insert({
        newsletter_id: nid,
        recipient_email: email,
        event_type: "click",
        metadata: { url: safeUrl, article: article || "" },
      });
      await supabase.rpc("increment_click_count", { nid });
      void logEmailClick("", email as string, nid as string, safeUrl);
    } catch {
      // silently ignore tracking errors
    }
  }

  return NextResponse.redirect(safeUrl, { status: 302 });
}
