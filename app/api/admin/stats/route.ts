import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: Request) {
  const admin = getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total users
    const { count: totalUsers } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // New users (last 7 days)
    const { count: newUsers } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString());

    // Active users (sent a newsletter in last 30 days)
    const { data: activeNewsletters } = await supabaseAdmin
      .from("newsletters")
      .select("user_id")
      .eq("status", "sent")
      .gte("sent_at", thirtyDaysAgo.toISOString());

    const activeUserIds = new Set(activeNewsletters?.map((n) => n.user_id) || []);
    const activeUsers = activeUserIds.size;

    // Plan distribution
    const { data: planData } = await supabaseAdmin
      .from("profiles")
      .select("plan");

    const planDistribution = { free: 0, pro: 0, business: 0, enterprise: 0 };
    for (const p of planData || []) {
      const plan = p.plan as keyof typeof planDistribution;
      if (plan in planDistribution) planDistribution[plan]++;
    }

    // Trial conversion rate
    const { data: trialUsers } = await supabaseAdmin
      .from("profiles")
      .select("plan, trial_ends_at")
      .not("trial_ends_at", "is", null);

    const totalTrials = trialUsers?.length || 0;
    const convertedTrials = trialUsers?.filter((u) => u.plan !== "free").length || 0;
    const trialConversionRate = totalTrials > 0 ? Math.round((convertedTrials / totalTrials) * 100) : 0;

    // MRR from Stripe
    let mrr = 0;
    try {
      const subscriptions = await stripe.subscriptions.list({
        status: "active",
        limit: 100,
      });
      for (const sub of subscriptions.data) {
        const item = sub.items.data[0];
        if (item?.price?.unit_amount && item?.price?.recurring) {
          const amount = item.price.unit_amount / 100;
          if (item.price.recurring.interval === "year") {
            mrr += amount / 12;
          } else {
            mrr += amount;
          }
        }
      }
      mrr = Math.round(mrr);
    } catch {
      // Stripe error — non-blocking
    }

    // Signups per day (last 30 days)
    const { data: recentSignups } = await supabaseAdmin
      .from("profiles")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    const signupsByDay: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      signupsByDay[d.toISOString().split("T")[0]] = 0;
    }
    for (const s of recentSignups || []) {
      const day = s.created_at.split("T")[0];
      if (day in signupsByDay) signupsByDay[day]++;
    }
    const signupsChart = Object.entries(signupsByDay).map(([date, count]) => ({ date, count }));

    // Recent activity
    const { data: recentUsers } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, plan, created_at, referred_by")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      newUsers: newUsers || 0,
      activeUsers,
      mrr,
      trialConversionRate,
      planDistribution,
      signupsChart,
      recentUsers: recentUsers || [],
    });
  } catch {
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
