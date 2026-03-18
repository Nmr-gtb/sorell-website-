// NOTE: Run in Supabase SQL Editor:
// CREATE OR REPLACE FUNCTION increment_open_count(nid uuid) RETURNS void AS $$
//   UPDATE public.newsletters SET open_count = open_count + 1 WHERE id = nid;
// $$ LANGUAGE sql;

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nid = searchParams.get("nid"); // newsletter_id
  const email = searchParams.get("email");

  if (nid && email) {
    // Check if already tracked this open (avoid counting multiple opens)
    const { data: existing } = await supabase
      .from("newsletter_events")
      .select("id")
      .eq("newsletter_id", nid)
      .eq("recipient_email", email)
      .eq("event_type", "open")
      .limit(1);

    if (!existing?.length) {
      await supabase.from("newsletter_events").insert({
        newsletter_id: nid,
        recipient_email: email,
        event_type: "open",
      });

      // Increment open_count on newsletter
      await supabase.rpc("increment_open_count", { nid });
    }
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
