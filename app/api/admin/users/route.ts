import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const admin = getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Math.min(parseInt(searchParams.get("page") || "1") || 1, 1000));
    const limit = Math.max(1, Math.min(parseInt(searchParams.get("limit") || "25") || 25, 100));
    const plan = searchParams.get("plan");
    const search = searchParams.get("search");
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const VALID_PLANS = ["free", "pro", "business", "enterprise"];
    if (plan && plan !== "all") {
      if (!VALID_PLANS.includes(plan)) {
        return NextResponse.json({ error: "Plan invalide." }, { status: 400 });
      }
      query = query.eq("plan", plan);
    }

    if (search) {
      // Sanitize search input: remove PostgREST special characters to prevent injection
      const sanitized = search.replace(/[%_\\(),.]/g, "").trim().slice(0, 100);
      if (sanitized.length > 0) {
        query = query.or(`email.ilike.%${sanitized}%,full_name.ilike.%${sanitized}%`);
      }
    }

    const { data: users, count } = await query;

    if (!users) {
      return NextResponse.json({ users: [], total: 0, page, limit });
    }

    // Get newsletter counts per user
    const userIds = users.map((u) => u.id);
    const { data: newsletterCounts } = await supabaseAdmin
      .from("newsletters")
      .select("user_id")
      .in("user_id", userIds)
      .eq("status", "sent");

    const countMap: Record<string, number> = {};
    for (const n of newsletterCounts || []) {
      countMap[n.user_id] = (countMap[n.user_id] || 0) + 1;
    }

    // Get last newsletter date per user
    const { data: lastNewsletters } = await supabaseAdmin
      .from("newsletters")
      .select("user_id, sent_at")
      .in("user_id", userIds)
      .eq("status", "sent")
      .order("sent_at", { ascending: false });

    const lastSentMap: Record<string, string> = {};
    for (const n of lastNewsletters || []) {
      if (!lastSentMap[n.user_id]) lastSentMap[n.user_id] = n.sent_at;
    }

    // Get recipient counts per user
    const { data: recipientData } = await supabaseAdmin
      .from("recipients")
      .select("user_id")
      .in("user_id", userIds);

    const recipientCountMap: Record<string, number> = {};
    for (const r of recipientData || []) {
      recipientCountMap[r.user_id] = (recipientCountMap[r.user_id] || 0) + 1;
    }

    const enrichedUsers = users.map((u) => ({
      ...u,
      newsletters_sent: countMap[u.id] || 0,
      last_newsletter_at: lastSentMap[u.id] || null,
      recipient_count: recipientCountMap[u.id] || 0,
    }));

    return NextResponse.json({
      users: enrichedUsers,
      total: count || 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
