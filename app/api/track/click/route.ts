import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nid = searchParams.get("nid");
  const email = searchParams.get("email");
  const url = searchParams.get("url");
  const article = searchParams.get("article");

  try {
    if (nid && email) {
      await supabase.from("newsletter_events").insert({
        newsletter_id: nid,
        recipient_email: email,
        event_type: "click",
        metadata: { url: url || "", article: article || "" },
      });

      await supabase.rpc("increment_click_count", { nid });
    }
  } catch (err) {
    console.error("Track click error:", err);
  }

  return NextResponse.redirect(url || "https://sorell.fr", { status: 302 });
}
