/**
 * Eva Stats — Métriques business pour le bot Telegram.
 * Permet à Noé de consulter ses KPIs depuis son téléphone.
 */

import { stripe, PRICE_IDS } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

// --- Prix mensuels pour calcul MRR ---

const MONTHLY_AMOUNT: Record<string, number> = {
  [PRICE_IDS.pro_monthly]: 19,
  [PRICE_IDS.pro_annual]: Math.round((190 / 12) * 100) / 100, // 15.83€
  [PRICE_IDS.business_monthly]: 49,
  [PRICE_IDS.business_annual]: Math.round((490 / 12) * 100) / 100, // 40.83€
};

// --- Helpers ---

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

// --- Business Overview ---

export async function getBusinessOverview(): Promise<string> {
  try {
    const [mrr, userStats, recentActivity] = await Promise.all([
      calculateMRR(),
      getUserStats(),
      getRecentActivity(),
    ]);

    let msg = `<b>Dashboard Sorell</b>\n\n`;
    msg += `<b>Revenu</b>\n`;
    msg += `MRR : <b>${mrr}€</b>\n\n`;
    msg += `<b>Utilisateurs</b>\n`;
    msg += `Total : ${userStats.total}\n`;
    msg += `Payants : ${userStats.paid}\n`;
    msg += `En trial : ${userStats.trial}\n`;
    msg += `Free : ${userStats.free}\n\n`;
    msg += `<b>7 derniers jours</b>\n`;
    msg += `Inscriptions : ${recentActivity.signups}\n`;
    msg += `Newsletters envoyées : ${recentActivity.newslettersSent}`;

    return msg;
  } catch {
    return "Impossible de charger les stats pour le moment.";
  }
}

// --- MRR ---

async function calculateMRR(): Promise<number> {
  const subscriptions = await stripe.subscriptions.list({
    status: "active",
    limit: 100,
  });

  let mrr = 0;
  for (const sub of subscriptions.data) {
    const priceId = sub.items.data[0]?.price.id;
    if (priceId && MONTHLY_AMOUNT[priceId]) {
      mrr += MONTHLY_AMOUNT[priceId];
    }
  }

  // Inclure les trials (ils paieront bientôt)
  const trialSubs = await stripe.subscriptions.list({
    status: "trialing",
    limit: 100,
  });

  for (const sub of trialSubs.data) {
    const priceId = sub.items.data[0]?.price.id;
    if (priceId && MONTHLY_AMOUNT[priceId]) {
      mrr += MONTHLY_AMOUNT[priceId];
    }
  }

  return Math.round(mrr * 100) / 100;
}

async function getUserStats(): Promise<{
  total: number;
  paid: number;
  trial: number;
  free: number;
}> {
  const { count: total } = await supabaseAdmin
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: paid } = await supabaseAdmin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .neq("plan", "free");

  const now = new Date().toISOString();
  const { count: trial } = await supabaseAdmin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .neq("plan", "free")
    .gt("trial_ends_at", now);

  return {
    total: total ?? 0,
    paid: paid ?? 0,
    trial: trial ?? 0,
    free: (total ?? 0) - (paid ?? 0),
  };
}

async function getRecentActivity(): Promise<{
  signups: number;
  newslettersSent: number;
}> {
  const sevenDaysAgo = daysAgo(7);

  const { count: signups } = await supabaseAdmin
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gt("created_at", sevenDaysAgo);

  const { count: newslettersSent } = await supabaseAdmin
    .from("newsletters")
    .select("*", { count: "exact", head: true })
    .gt("sent_at", sevenDaysAgo);

  return {
    signups: signups ?? 0,
    newslettersSent: newslettersSent ?? 0,
  };
}

// --- Signups ---

export async function getSignupStats(days: number = 7): Promise<string> {
  try {
    const since = daysAgo(days);

    const { data, count } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email, plan, created_at", { count: "exact" })
      .gt("created_at", since)
      .order("created_at", { ascending: false });

    if (!count || count === 0) {
      return `Aucune inscription ces ${days} derniers jours.`;
    }

    let msg = `<b>${count} inscription(s) ces ${days} derniers jours</b>\n\n`;
    for (const user of data ?? []) {
      const name = user.full_name || "Sans nom";
      const plan = user.plan === "free" ? "Free" : user.plan.charAt(0).toUpperCase() + user.plan.slice(1);
      msg += `${name} — ${user.email} (${plan}, ${formatDate(user.created_at)})\n`;
    }

    return msg;
  } catch {
    return "Impossible de charger les inscriptions.";
  }
}

// --- MRR (standalone) ---

export async function getMRRStats(): Promise<string> {
  try {
    const mrr = await calculateMRR();

    const subscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
    });

    const trialSubs = await stripe.subscriptions.list({
      status: "trialing",
      limit: 100,
    });

    let msg = `<b>MRR : ${mrr}€</b>\n\n`;
    msg += `Abonnements actifs : ${subscriptions.data.length}\n`;
    msg += `Trials en cours : ${trialSubs.data.length}\n`;

    if (mrr > 0) {
      const arr = mrr * 12;
      msg += `ARR estimé : ${Math.round(arr)}€`;
    }

    return msg;
  } catch {
    return "Impossible de calculer le MRR.";
  }
}

// --- Conversion ---

export async function getConversionStats(): Promise<string> {
  try {
    // Users qui ont ou ont eu un trial
    const { data: trialUsers } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, plan, trial_ends_at")
      .not("trial_ends_at", "is", null);

    if (!trialUsers || trialUsers.length === 0) {
      return "Aucun utilisateur en trial pour le moment.";
    }

    const now = new Date();
    const converted = trialUsers.filter((u) => u.plan !== "free");
    const activeTrials = trialUsers.filter(
      (u) => u.trial_ends_at && new Date(u.trial_ends_at) > now
    );
    const expiredNotConverted = trialUsers.filter(
      (u) => u.plan === "free" && u.trial_ends_at && new Date(u.trial_ends_at) <= now
    );

    const rate = trialUsers.length > 0
      ? Math.round((converted.length / trialUsers.length) * 100)
      : 0;

    let msg = `<b>Conversion trial → payant</b>\n\n`;
    msg += `Taux : <b>${rate}%</b> (${converted.length}/${trialUsers.length})\n`;
    msg += `Trials actifs : ${activeTrials.length}\n`;
    msg += `Trials expirés sans conversion : ${expiredNotConverted.length}\n`;

    if (activeTrials.length > 0) {
      msg += `\n<b>Trials en cours :</b>\n`;
      for (const u of activeTrials) {
        const name = u.full_name || u.email;
        const daysLeft = Math.ceil(
          (new Date(u.trial_ends_at!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        msg += `${name} — ${daysLeft}j restants\n`;
      }
    }

    return msg;
  } catch {
    return "Impossible de charger les stats de conversion.";
  }
}

// --- Churn ---

export async function getChurnStats(): Promise<string> {
  try {
    // Users qui ont un stripe_customer_id mais sont en free = ex-payants
    const { data: churned } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email, created_at")
      .eq("plan", "free")
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false });

    if (!churned || churned.length === 0) {
      return "Aucun churn détecté. Tous les ex-utilisateurs Stripe sont encore payants.";
    }

    let msg = `<b>${churned.length} utilisateur(s) ayant quitté un plan payant</b>\n\n`;
    for (const u of churned) {
      const name = u.full_name || "Sans nom";
      msg += `${name} — ${u.email}\n`;
    }

    return msg;
  } catch {
    return "Impossible de charger les stats de churn.";
  }
}

// --- Inactive Users ---

export async function getInactiveUsers(days: number = 5): Promise<string> {
  try {
    const cutoff = daysAgo(days);

    // Users inscrits depuis plus de N jours
    const { data: oldUsers } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, plan, created_at")
      .lt("created_at", cutoff)
      .order("created_at", { ascending: false });

    if (!oldUsers || oldUsers.length === 0) {
      return "Aucun utilisateur inscrit depuis plus de 5 jours.";
    }

    // Vérifier lesquels n'ont jamais généré de newsletter
    const inactiveUsers: typeof oldUsers = [];
    for (const user of oldUsers) {
      const { count } = await supabaseAdmin
        .from("newsletters")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (!count || count === 0) {
        inactiveUsers.push(user);
      }
    }

    if (inactiveUsers.length === 0) {
      return "Tous les utilisateurs ont généré au moins une newsletter.";
    }

    let msg = `<b>${inactiveUsers.length} utilisateur(s) inactif(s)</b>\n`;
    msg += `(inscrits depuis +${days}j, jamais généré de newsletter)\n\n`;

    for (const u of inactiveUsers) {
      const name = u.full_name || "Sans nom";
      const plan = u.plan === "free" ? "Free" : u.plan.charAt(0).toUpperCase() + u.plan.slice(1);
      msg += `${name} — ${u.email} (${plan}, inscrit le ${formatDate(u.created_at)})\n`;
    }

    return msg;
  } catch {
    return "Impossible de charger les utilisateurs inactifs.";
  }
}

// --- User Lookup ---

export async function getUserInfo(query: string): Promise<string> {
  try {
    // Chercher par email exact d'abord
    let { data } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, plan, created_at, email_verified, stripe_customer_id, trial_ends_at")
      .ilike("email", `%${query}%`)
      .limit(5);

    // Si pas trouvé, chercher par nom
    if (!data || data.length === 0) {
      const result = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, plan, created_at, email_verified, stripe_customer_id, trial_ends_at")
        .ilike("full_name", `%${query}%`)
        .limit(5);
      data = result.data;
    }

    if (!data || data.length === 0) {
      return `Aucun utilisateur trouvé pour "${query}".`;
    }

    let msg = "";
    for (const user of data) {
      const name = user.full_name || "Sans nom";
      const plan = user.plan === "free" ? "Free" : user.plan.charAt(0).toUpperCase() + user.plan.slice(1);
      const verified = user.email_verified ? "Oui" : "Non";

      // Compter les newsletters
      const { count: nlCount } = await supabaseAdmin
        .from("newsletters")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Dernière newsletter
      const { data: lastNl } = await supabaseAdmin
        .from("newsletters")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      // Config existante ?
      const { data: config } = await supabaseAdmin
        .from("newsletter_config")
        .select("topics, frequency")
        .eq("user_id", user.id)
        .maybeSingle();

      msg += `<b>${name}</b>\n`;
      msg += `Email : ${user.email}\n`;
      msg += `Plan : ${plan}\n`;
      msg += `Vérifié : ${verified}\n`;
      msg += `Inscrit le : ${formatDate(user.created_at)}\n`;
      msg += `Newsletters : ${nlCount ?? 0}`;
      if (lastNl?.[0]) {
        msg += ` (dernière : ${formatDate(lastNl[0].created_at)})`;
      }
      msg += "\n";
      msg += `Config : ${config ? `${config.topics?.length ?? 0} topics, fréquence ${config.frequency ?? "non définie"}` : "Non configuré"}\n`;

      if (user.trial_ends_at) {
        const trialEnd = new Date(user.trial_ends_at);
        const now = new Date();
        if (trialEnd > now) {
          const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          msg += `Trial : ${daysLeft}j restants\n`;
        } else {
          msg += `Trial : expiré\n`;
        }
      }

      if (data.length > 1) msg += "\n";
    }

    return msg;
  } catch {
    return "Impossible de chercher cet utilisateur.";
  }
}

// --- Business context for Eva conversations ---

export async function getBusinessContext(): Promise<string> {
  try {
    const [mrr, stats, activity] = await Promise.all([
      calculateMRR(),
      getUserStats(),
      getRecentActivity(),
    ]);

    let ctx = `\n\nMétriques business actuelles :`;
    ctx += ` MRR ${mrr}€, ${stats.total} utilisateurs (${stats.paid} payants, ${stats.trial} trials, ${stats.free} free).`;
    ctx += ` 7 derniers jours : ${activity.signups} inscriptions, ${activity.newslettersSent} newsletters envoyées.`;

    return ctx;
  } catch {
    return "";
  }
}

// --- Proactive alerts for CRON ---

export async function checkBusinessAlerts(): Promise<string | null> {
  try {
    const alerts: string[] = [];
    const now = new Date();

    // 1. Trials qui expirent dans les 2 prochains jours
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const { data: expiringTrials } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email, trial_ends_at")
      .neq("plan", "free")
      .gt("trial_ends_at", now.toISOString())
      .lt("trial_ends_at", twoDaysFromNow);

    if (expiringTrials && expiringTrials.length > 0) {
      let alert = `⏰ <b>${expiringTrials.length} trial(s) expirent bientôt</b>\n`;
      for (const u of expiringTrials) {
        const name = u.full_name || u.email;
        const daysLeft = Math.ceil(
          (new Date(u.trial_ends_at!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        alert += `  ${name} — ${daysLeft}j\n`;
      }
      alerts.push(alert);
    }

    // 2. Users inscrits il y a 3 jours sans newsletter
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    const { data: recentInactive } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .gt("created_at", fourDaysAgo.toISOString())
      .lt("created_at", threeDaysAgo.toISOString());

    if (recentInactive && recentInactive.length > 0) {
      const inactive: typeof recentInactive = [];
      for (const u of recentInactive) {
        const { count } = await supabaseAdmin
          .from("newsletters")
          .select("*", { count: "exact", head: true })
          .eq("user_id", u.id);
        if (!count || count === 0) inactive.push(u);
      }

      if (inactive.length > 0) {
        let alert = `👻 <b>${inactive.length} user(s) inscrit(s) il y a 3j sans newsletter</b>\n`;
        for (const u of inactive) {
          alert += `  ${u.full_name || u.email}\n`;
        }
        alerts.push(alert);
      }
    }

    if (alerts.length === 0) return null;
    return alerts.join("\n");
  } catch {
    return null;
  }
}
