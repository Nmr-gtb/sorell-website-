import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const LIFECYCLE_STAGES = [
  "welcome",
  "onboarding",
  "trial_reminder_3d",
  "trial_reminder_1d",
  "trial_reminder_0d",
  "limit_reached",
  "upsell",
  "payment_failed",
  "feedback",
] as const;

export async function GET(request: Request) {
  const admin = getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    // Get all users with their lifecycle status
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, plan, trial_ends_at, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    // Get all lifecycle emails
    const { data: allLifecycleEmails } = await supabaseAdmin
      .from("lifecycle_emails")
      .select("*")
      .order("sent_at", { ascending: false });

    // Get newsletter configs (to check who configured)
    const { data: configs } = await supabaseAdmin
      .from("newsletter_config")
      .select("user_id");

    const configuredUserIds = new Set((configs || []).map((c) => c.user_id));

    // Get users who sent at least one newsletter
    const { data: sentNewsletters } = await supabaseAdmin
      .from("newsletters")
      .select("user_id")
      .eq("status", "sent");

    const sentUserIds = new Set((sentNewsletters || []).map((n) => n.user_id));

    // Build lifecycle map per user
    const lifecycleMap: Record<string, string[]> = {};
    for (const le of allLifecycleEmails || []) {
      if (!lifecycleMap[le.user_id]) lifecycleMap[le.user_id] = [];
      lifecycleMap[le.user_id].push(le.email_type);
    }

    const now = new Date();

    const pipeline = (profiles || []).map((p) => {
      const emailsReceived = lifecycleMap[p.id] || [];
      const hasConfig = configuredUserIds.has(p.id);
      const hasSent = sentUserIds.has(p.id);
      const trialEndsAt = p.trial_ends_at ? new Date(p.trial_ends_at) : null;
      const isPaid = p.plan !== "free";

      // Determine current stage
      let currentStage = "inscrit";
      if (emailsReceived.includes("welcome")) currentStage = "welcome_sent";
      if (emailsReceived.includes("onboarding")) currentStage = "onboarding_sent";
      if (hasConfig) currentStage = "configured";
      if (hasSent) currentStage = "first_newsletter_sent";
      if (emailsReceived.includes("trial_reminder_3d")) currentStage = "trial_reminder_3d";
      if (emailsReceived.includes("trial_reminder_1d")) currentStage = "trial_reminder_1d";
      if (emailsReceived.includes("trial_reminder_0d")) currentStage = "trial_expired";
      if (isPaid) currentStage = "converted";
      if (emailsReceived.includes("payment_failed")) currentStage = "payment_failed";

      // Days since signup
      const daysSinceSignup = Math.floor(
        (now.getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Trial remaining
      let trialDaysRemaining: number | null = null;
      if (trialEndsAt) {
        trialDaysRemaining = Math.ceil(
          (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      return {
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        plan: p.plan,
        created_at: p.created_at,
        current_stage: currentStage,
        emails_received: emailsReceived,
        has_config: hasConfig,
        has_sent_newsletter: hasSent,
        days_since_signup: daysSinceSignup,
        trial_days_remaining: trialDaysRemaining,
        is_paid: isPaid,
      };
    });

    // Stage counts for summary
    const stageCounts: Record<string, number> = {};
    for (const p of pipeline) {
      stageCounts[p.current_stage] = (stageCounts[p.current_stage] || 0) + 1;
    }

    return NextResponse.json({
      pipeline,
      stageCounts,
      stages: LIFECYCLE_STAGES,
    });
  } catch {
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
