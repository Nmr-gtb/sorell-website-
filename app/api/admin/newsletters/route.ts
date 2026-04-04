import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, isValidUUID } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const admin = getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Math.min(parseInt(searchParams.get("page") || "1") || 1, 1000));
    const limit = Math.max(1, Math.min(parseInt(searchParams.get("limit") || "25") || 25, 100));
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const offset = (page - 1) * limit;

    if (userId && !isValidUUID(userId)) {
      return NextResponse.json({ error: "Identifiant utilisateur invalide." }, { status: 400 });
    }

    const VALID_STATUSES = ["sent", "draft", "failed"];
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    }

    let query = supabaseAdmin
      .from("newsletters")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data: newsletters, count } = await query;

    if (!newsletters?.length) {
      return NextResponse.json({ newsletters: [], total: 0, page, limit });
    }

    // Get user info for each newsletter
    const userIds = [...new Set(newsletters.map((n) => n.user_id))];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    const profileMap: Record<string, { email: string; full_name: string }> = {};
    for (const p of profiles || []) {
      profileMap[p.id] = { email: p.email, full_name: p.full_name };
    }

    // Get events for these newsletters
    const newsletterIds = newsletters.map((n) => n.id);
    const { data: events } = await supabaseAdmin
      .from("newsletter_events")
      .select("newsletter_id, event_type")
      .in("newsletter_id", newsletterIds);

    const eventCounts: Record<string, { opens: number; clicks: number }> = {};
    for (const e of events || []) {
      if (!eventCounts[e.newsletter_id]) {
        eventCounts[e.newsletter_id] = { opens: 0, clicks: 0 };
      }
      if (e.event_type === "open") eventCounts[e.newsletter_id].opens++;
      if (e.event_type === "click") eventCounts[e.newsletter_id].clicks++;
    }

    const enriched = newsletters.map((n) => ({
      id: n.id,
      user_id: n.user_id,
      user_email: profileMap[n.user_id]?.email || "",
      user_name: profileMap[n.user_id]?.full_name || "",
      subject: n.subject,
      status: n.status,
      recipient_count: n.recipient_count || 0,
      created_at: n.created_at,
      sent_at: n.sent_at,
      opens: eventCounts[n.id]?.opens || 0,
      clicks: eventCounts[n.id]?.clicks || 0,
      open_rate: n.recipient_count
        ? Math.round(((eventCounts[n.id]?.opens || 0) / n.recipient_count) * 100)
        : 0,
      click_rate: n.recipient_count
        ? Math.round(((eventCounts[n.id]?.clicks || 0) / n.recipient_count) * 100)
        : 0,
    }));

    return NextResponse.json({
      newsletters: enriched,
      total: count || 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
