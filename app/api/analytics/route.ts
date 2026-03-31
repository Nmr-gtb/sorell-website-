import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId || userId !== authUser.id) {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  }

  // Get all newsletters for this user
  const { data: newsletters } = await supabase
    .from("newsletters")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "sent")
    .order("sent_at", { ascending: false });

  if (!newsletters?.length) {
    return NextResponse.json({
      openRate: 0,
      clickRate: 0,
      totalSent: 0,
      totalOpens: 0,
      totalClicks: 0,
      activeRecipients: 0,
      newsletters: [],
      topArticles: [],
      weeklyData: [],
    });
  }

  // Get recipients count
  const { data: recipients } = await supabase
    .from("recipients")
    .select("id")
    .eq("user_id", userId);

  const recipientCount = recipients?.length || 1;

  // Get all events for these newsletters
  const newsletterIds = newsletters.map((n) => n.id);
  const { data: events } = await supabase
    .from("newsletter_events")
    .select("*")
    .in("newsletter_id", newsletterIds);

  const allEvents = events || [];
  const opens = allEvents.filter((e) => e.event_type === "open");
  const clicks = allEvents.filter((e) => e.event_type === "click");

  // Calculate rates
  const totalSent = newsletters.reduce((sum, nl) => sum + (nl.recipient_count || recipientCount), 0);
  const totalOpens = opens.length;
  const totalClicks = clicks.length;
  const openRate = totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0;
  const clickRate = totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : 0;

  // Top articles by clicks
  const articleClicks: Record<string, number> = {};
  for (const click of clicks) {
    const article = click.metadata?.article || "Unknown";
    articleClicks[article] = (articleClicks[article] || 0) + 1;
  }
  const topArticles = Object.entries(articleClicks)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([title, count]) => ({ title, clicks: count }));

  // Weekly data (last 8 newsletters)
  const weeklyData = newsletters
    .slice(0, 8)
    .reverse()
    .map((nl, i) => {
      const nlOpens = opens.filter((e) => e.newsletter_id === nl.id).length;
      const nlRecipients = nl.recipient_count || recipientCount;
      const rate = nlRecipients > 0 ? Math.round((nlOpens / nlRecipients) * 100) : 0;
      return { label: `S${i + 1}`, value: rate };
    });

  // Newsletter history
  const newsletterHistory = newsletters.slice(0, 10).map((nl) => {
    const nlOpens = opens.filter((e) => e.newsletter_id === nl.id).length;
    const nlClicks = clicks.filter((e) => e.newsletter_id === nl.id).length;
    const nlRecipients = nl.recipient_count || recipientCount;
    return {
      id: nl.id,
      date: nl.sent_at,
      subject: nl.subject,
      recipients: nlRecipients,
      openRate: nlRecipients > 0 ? Math.round((nlOpens / nlRecipients) * 100) : 0,
      clickRate: nlRecipients > 0 ? Math.round((nlClicks / nlRecipients) * 100) : 0,
      articleCount: Array.isArray(nl.content) ? nl.content.length : 0,
    };
  });

  return NextResponse.json({
    openRate,
    clickRate,
    totalSent: newsletters.length,
    totalOpens,
    totalClicks,
    activeRecipients: recipientCount,
    newsletters: newsletterHistory,
    topArticles,
    weeklyData,
  });
}
