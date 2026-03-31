import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId || userId !== authUser.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    // Supprimer dans l'ordre (a cause des foreign keys)
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
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
