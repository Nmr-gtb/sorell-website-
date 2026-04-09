import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { logEmailOpen } from "@/lib/activity-log";

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nid = searchParams.get("nid");
  const email = searchParams.get("email");

  try {
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

        await supabase.rpc("increment_open_count", { nid });

        // Activity log - userId not available in tracking pixel context
        void logEmailOpen("", email, nid);
      }
    }
  } catch (err) {
    // silently ignore
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
