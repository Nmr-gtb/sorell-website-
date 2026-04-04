import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, isValidUUID } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const VALID_PLANS = ["free", "pro", "business", "enterprise"] as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  try {
    // Profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Utilisateur non trouvé." }, { status: 404 });
    }

    // Newsletter config
    const { data: config } = await supabaseAdmin
      .from("newsletter_config")
      .select("*")
      .eq("user_id", id)
      .single();

    // Newsletters history
    const { data: newsletters } = await supabaseAdmin
      .from("newsletters")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Recipients
    const { data: recipients } = await supabaseAdmin
      .from("recipients")
      .select("*")
      .eq("user_id", id);

    // Lifecycle emails
    const { data: lifecycleEmails } = await supabaseAdmin
      .from("lifecycle_emails")
      .select("*")
      .eq("user_id", id)
      .order("sent_at", { ascending: false });

    // Newsletter events
    const newsletterIds = (newsletters || []).map((n) => n.id);
    let events: { newsletter_id: string; event_type: string; recipient_email: string; created_at: string }[] = [];
    if (newsletterIds.length > 0) {
      const { data: eventsData } = await supabaseAdmin
        .from("newsletter_events")
        .select("*")
        .in("newsletter_id", newsletterIds)
        .order("created_at", { ascending: false })
        .limit(100);
      events = eventsData || [];
    }

    // Referral info
    const { data: referrals } = await supabaseAdmin
      .from("referrals")
      .select("*")
      .or(`referrer_id.eq.${id},referee_id.eq.${id}`);

    return NextResponse.json({
      profile,
      config,
      newsletters: newsletters || [],
      recipients: recipients || [],
      lifecycleEmails: lifecycleEmails || [],
      events,
      referrals: referrals || [],
    });
  } catch {
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const updates: Record<string, string> = {};

    // Validate plan against whitelist
    if (body.plan !== undefined) {
      if (typeof body.plan !== "string" || !VALID_PLANS.includes(body.plan as typeof VALID_PLANS[number])) {
        return NextResponse.json({ error: "Plan invalide." }, { status: 400 });
      }
      updates.plan = body.plan;
    }

    // Validate full_name
    if (body.full_name !== undefined) {
      if (typeof body.full_name !== "string" || body.full_name.length > 200) {
        return NextResponse.json({ error: "Nom invalide." }, { status: 400 });
      }
      updates.full_name = body.full_name.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Aucun champ a mettre a jour." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Mise à jour échouée." }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch {
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  try {
    // Delete in order: events, newsletters, recipients, config, lifecycle, referrals, profile
    const { data: newsletters } = await supabaseAdmin
      .from("newsletters")
      .select("id")
      .eq("user_id", id);

    if (newsletters?.length) {
      await supabaseAdmin
        .from("newsletter_events")
        .delete()
        .in("newsletter_id", newsletters.map((n) => n.id));
    }

    await supabaseAdmin.from("newsletters").delete().eq("user_id", id);
    await supabaseAdmin.from("recipients").delete().eq("user_id", id);
    await supabaseAdmin.from("newsletter_config").delete().eq("user_id", id);
    await supabaseAdmin.from("lifecycle_emails").delete().eq("user_id", id);
    await supabaseAdmin.from("referrals").delete().or(`referrer_id.eq.${id},referee_id.eq.${id}`);
    await supabaseAdmin.from("profiles").delete().eq("id", id);

    // Delete from Supabase Auth
    await supabaseAdmin.auth.admin.deleteUser(id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
