import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { logEmailClick } from "@/lib/activity-log";

// Whitelist de domaines autorisés pour la redirection
const ALLOWED_DOMAINS = new Set([
  "sorell.fr",
  "www.sorell.fr",
]);

function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Autoriser uniquement https
    if (parsed.protocol !== "https:") return false;
    // Autoriser les domaines whitelistés OU tout domaine externe (articles de presse)
    // Bloquer les protocoles dangereux (javascript:, data:, etc.) déjà filtré par le check https
    return true;
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

  // Valider l'URL avant toute redirection
  const safeUrl = url && isUrlSafe(url) ? url : "https://sorell.fr";

  try {
    if (nid && email) {
      await supabase.from("newsletter_events").insert({
        newsletter_id: nid,
        recipient_email: email,
        event_type: "click",
        metadata: { url: safeUrl, article: article || "" },
      });

      await supabase.rpc("increment_click_count", { nid });

      // Activity log - userId not available in tracking context
      void logEmailClick("", email, nid, safeUrl);
    }
  } catch {
    // silently ignore tracking errors
  }

  return NextResponse.redirect(safeUrl, { status: 302 });
}
