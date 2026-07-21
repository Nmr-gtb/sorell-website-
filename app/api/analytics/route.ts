import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { computeAnalytics } from "@/lib/analytics-stats";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const rawPeriod = searchParams.get("period");
    // Validation stricte : un lookup d'objet laisserait passer les clés du
    // prototype (?period=constructor → RangeError sur toISOString → 500).
    const periodDays = rawPeriod === "30" ? 30 : rawPeriod === "90" ? 90 : null;
    const period = periodDays ? rawPeriod : "all";

    if (!userId || userId !== authUser.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    let newslettersQuery = supabase
      .from("newsletters")
      .select("id, subject, sent_at, recipient_count, content")
      .eq("user_id", userId)
      .eq("status", "sent")
      .order("sent_at", { ascending: false });

    if (periodDays) {
      const cutoff = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
      newslettersQuery = newslettersQuery.gte("sent_at", cutoff);
    }

    const [newslettersResult, recipientsResult] = await Promise.all([
      newslettersQuery,
      supabase.from("recipients").select("id").eq("user_id", userId),
    ]);
    if (newslettersResult.error) throw new Error("newsletters query failed");
    if (recipientsResult.error) throw new Error("recipients query failed");

    const newsletters = newslettersResult.data;
    // Le compte de destinataires est réel même sans envoi sur la période
    // (un « 0 » en dur mentirait à un compte actif filtré sur 30 j).
    const activeRecipients = recipientsResult.data?.length || 0;

    if (!newsletters?.length) {
      return NextResponse.json({
        openRate: null,
        clickRate: null,
        totalSent: 0,
        totalOpens: 0,
        totalClicks: 0,
        activeRecipients,
        newsletters: [],
        topArticles: [],
        trend: [],
        period,
      });
    }

    const eventsResult = await supabase
      .from("newsletter_events")
      .select("newsletter_id, recipient_email, event_type, metadata")
      .in("newsletter_id", newsletters.map((n) => n.id));
    if (eventsResult.error) throw new Error("events query failed");

    const stats = computeAnalytics(newsletters, eventsResult.data || [], activeRecipients);

    return NextResponse.json({ ...stats, period });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
