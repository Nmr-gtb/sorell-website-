import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Supprimer dans l'ordre (à cause des foreign keys)
    const { data: newsletters } = await supabase
      .from("newsletters")
      .select("id")
      .eq("user_id", userId);

    const newsletterIds = newsletters?.map((n) => n.id) || [];

    if (newsletterIds.length > 0) {
      await supabase.from("newsletter_events").delete().in("newsletter_id", newsletterIds);
    }

    await supabase.from("newsletters").delete().eq("user_id", userId);
    await supabase.from("recipients").delete().eq("user_id", userId);
    await supabase.from("newsletter_config").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Delete account error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
