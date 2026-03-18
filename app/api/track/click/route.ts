// NOTE: Run in Supabase SQL Editor:
// CREATE OR REPLACE FUNCTION increment_click_count(nid uuid) RETURNS void AS $$
//   UPDATE public.newsletters SET click_count = click_count + 1 WHERE id = nid;
// $$ LANGUAGE sql;

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
  const article = searchParams.get("article"); // article title

  if (nid && email) {
    await supabase.from("newsletter_events").insert({
      newsletter_id: nid,
      recipient_email: email,
      event_type: "click",
      metadata: { url: url || "", article: article || "" },
    });

    // Increment click_count on newsletter
    await supabase.rpc("increment_click_count", { nid });
  }

  // Redirect to original URL or home
  return NextResponse.redirect(url || "https://sorell.fr", { status: 302 });
}
