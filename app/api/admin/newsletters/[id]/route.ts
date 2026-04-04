import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { data: newsletter } = await supabaseAdmin
      .from("newsletters")
      .select("*")
      .eq("id", id)
      .single();

    if (!newsletter) {
      return NextResponse.json({ error: "Newsletter non trouvée." }, { status: 404 });
    }

    // Get user info
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", newsletter.user_id)
      .single();

    // Get events
    const { data: events } = await supabaseAdmin
      .from("newsletter_events")
      .select("*")
      .eq("newsletter_id", id)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      newsletter,
      profile,
      events: events || [],
    });
  } catch {
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
