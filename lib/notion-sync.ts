/**
 * Notion Sync — Synchronisation des utilisateurs et activites Sorell vers Notion.
 *
 * Databases Notion :
 * - "Utilisateurs Sorell" (NOTION_USERS_DB_ID)
 * - "Activite Sorell" (NOTION_ACTIVITY_DB_ID)
 *
 * Utilise le SDK @notionhq/client pour toutes les operations.
 * Toutes les fonctions sont fire-and-forget : elles ne lèvent jamais d'erreur.
 * Si NOTION_API_KEY n'est pas defini, les fonctions retournent silencieusement.
 */

import { Client } from "@notionhq/client";
import type {
  CreatePageParameters,
  UpdatePageParameters,
} from "@notionhq/client/build/src/api-endpoints";
import { supabaseAdmin } from "@/lib/supabase-admin";

// --- Types ---

export interface NotionUserData {
  supabaseId: string;
  email: string;
  fullName?: string;
  plan: string;
  emailVerified: boolean;
  createdAt: string;
  trialEndsAt?: string;
  stripeCustomerId?: string;
  source?: string;
  referredBy?: string;
  newslettersGenerated: number;
  newslettersSent: number;
  lastSentAt?: string;
  recipientCount: number;
  opens: number;
  clicks: number;
  lifecycleStage: string;
  brief?: string;
  topics?: string;
  frequency?: string;
}

export interface NotionActivityData {
  userId: string;
  userEmail: string;
  actionType: string;
  actionLabel: string;
  details?: string;
}

type ActivityType =
  | "inscription"
  | "verification_email"
  | "changement_plan"
  | "paiement_echoue"
  | "generation_newsletter"
  | "envoi_newsletter"
  | "ouverture_email"
  | "clic_email"
  | "bounce"
  | "ajout_destinataire"
  | "suppression_destinataire"
  | "changement_config"
  | "email_lifecycle"
  | "conversion_parrainage"
  | "suppression_compte";

// Type utilitaire pour les proprietes Notion
type NotionProperties = CreatePageParameters["properties"];

interface NotionQueryResult {
  id: string;
}

interface NotionQueryResponse {
  results: NotionQueryResult[];
}

interface ActivityLogRow {
  id: string;
  user_id: string;
  user_email: string;
  action_type: string;
  action_label: string;
  details: string | null;
}

// --- Helpers ---

function getNotionClient(): Client | null {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) return null;
  return new Client({ auth: apiKey });
}

function getUsersDatabaseId(): string | null {
  return process.env.NOTION_USERS_DB_ID ?? null;
}

function getActivityDatabaseId(): string | null {
  return process.env.NOTION_ACTIVITY_DB_ID ?? null;
}

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Requete la database Notion via fetch (le SDK v5 a deplace databases.query).
 * Retourne les resultats de la requete.
 */
async function queryDatabase(
  databaseId: string,
  filter: Record<string, unknown>,
  pageSize: number = 1
): Promise<NotionQueryResponse | null> {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({ filter, page_size: pageSize }),
    }
  );

  if (!response.ok) return null;

  return (await response.json()) as NotionQueryResponse;
}

// --- syncUserToNotion ---

/**
 * Cree ou met a jour une page utilisateur dans la database "Utilisateurs Sorell".
 * Recherche par "Supabase ID" pour trouver une page existante.
 * Fire-and-forget : ne lève jamais d'erreur.
 */
export async function syncUserToNotion(userData: NotionUserData): Promise<void> {
  try {
    const notion = getNotionClient();
    const databaseId = getUsersDatabaseId();
    if (!notion || !databaseId) return;

    // Recherche de la page existante par Supabase ID
    const searchResponse = await queryDatabase(databaseId, {
      property: "Supabase ID",
      rich_text: { equals: userData.supabaseId },
    });

    const properties = buildUserProperties(userData);

    if (searchResponse && searchResponse.results.length > 0) {
      // Mise a jour de la page existante
      const pageId = searchResponse.results[0].id;
      await notion.pages.update({
        page_id: pageId,
        properties: properties as UpdatePageParameters["properties"],
      });
    } else {
      // Creation d'une nouvelle page
      await notion.pages.create({
        parent: { database_id: databaseId },
        properties,
      });
    }
  } catch (error: unknown) {
    if (isDev()) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[notion-sync] syncUserToNotion error:", message);
    }
  }
}

function buildUserProperties(userData: NotionUserData): NotionProperties {
  const properties: NotionProperties = {
    Email: {
      title: [{ text: { content: userData.email } }],
    },
    "Supabase ID": {
      rich_text: [{ text: { content: userData.supabaseId } }],
    },
    Plan: {
      select: { name: userData.plan },
    },
    "Email vérifié": {
      checkbox: userData.emailVerified,
    },
    "Date inscription": {
      date: { start: userData.createdAt },
    },
    "Newsletters générées": {
      number: userData.newslettersGenerated,
    },
    "Newsletters envoyées": {
      number: userData.newslettersSent,
    },
    Destinataires: {
      number: userData.recipientCount,
    },
    Ouvertures: {
      number: userData.opens,
    },
    Clics: {
      number: userData.clicks,
    },
    "Étape lifecycle": {
      rich_text: [{ text: { content: userData.lifecycleStage } }],
    },
  };

  if (userData.fullName) {
    properties["Nom"] = {
      rich_text: [{ text: { content: userData.fullName } }],
    };
  }

  if (userData.trialEndsAt) {
    properties["Fin trial"] = {
      date: { start: userData.trialEndsAt },
    };
  }

  if (userData.stripeCustomerId) {
    properties["Stripe ID"] = {
      rich_text: [{ text: { content: userData.stripeCustomerId } }],
    };
  }

  if (userData.source) {
    properties["Source"] = {
      rich_text: [{ text: { content: userData.source } }],
    };
  }

  if (userData.referredBy) {
    properties["Parrain"] = {
      rich_text: [{ text: { content: userData.referredBy } }],
    };
  }

  if (userData.lastSentAt) {
    properties["Dernier envoi"] = {
      date: { start: userData.lastSentAt },
    };
  }

  if (userData.brief) {
    properties["Brief"] = {
      rich_text: [{ text: { content: userData.brief.slice(0, 2000) } }],
    };
  }

  if (userData.topics) {
    properties["Thématiques"] = {
      rich_text: [{ text: { content: userData.topics.slice(0, 2000) } }],
    };
  }

  if (userData.frequency) {
    properties["Fréquence"] = {
      rich_text: [{ text: { content: userData.frequency } }],
    };
  }

  return properties;
}

// --- logActivityToNotion ---

/**
 * Cree une page dans la database "Activite Sorell".
 * Fire-and-forget : ne lève jamais d'erreur.
 */
export async function logActivityToNotion(activity: NotionActivityData): Promise<void> {
  try {
    const notion = getNotionClient();
    const databaseId = getActivityDatabaseId();
    if (!notion || !databaseId) return;

    const properties: NotionProperties = {
      Action: {
        title: [{ text: { content: activity.actionLabel } }],
      },
      Type: {
        select: { name: activity.actionType as ActivityType },
      },
      "Email utilisateur": {
        rich_text: [{ text: { content: activity.userEmail } }],
      },
      Date: {
        date: { start: new Date().toISOString() },
      },
      "Supabase User ID": {
        rich_text: [{ text: { content: activity.userId } }],
      },
    };

    if (activity.details) {
      properties["Détails"] = {
        rich_text: [{ text: { content: activity.details.slice(0, 2000) } }],
      };
    }

    await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    });
  } catch (error: unknown) {
    if (isDev()) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[notion-sync] logActivityToNotion error:", message);
    }
  }
}

// --- syncAllUsersToNotion ---

/**
 * Synchronisation complete de tous les utilisateurs vers Notion.
 * Prevu pour etre appele par un CRON.
 * Retourne le nombre d'utilisateurs synchronises.
 */
export async function syncAllUsersToNotion(): Promise<number> {
  try {
    const notion = getNotionClient();
    if (!notion || !getUsersDatabaseId()) return 0;

    // Recuperer tous les profils
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, email, full_name, plan, email_verified, stripe_customer_id, stripe_subscription_id, trial_ends_at, referral_code, referred_by, created_at"
      );

    if (profilesError || !profiles) return 0;

    let syncedCount = 0;

    for (const profile of profiles) {
      // Config newsletter
      const { data: config } = await supabaseAdmin
        .from("newsletter_config")
        .select("custom_brief, topics, frequency")
        .eq("user_id", profile.id)
        .single();

      // Nombre de newsletters generees
      const { count: generatedCount } = await supabaseAdmin
        .from("newsletters")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id);

      // Nombre de newsletters envoyees
      const { count: sentCount } = await supabaseAdmin
        .from("newsletters")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .not("sent_at", "is", null);

      // Dernier envoi
      const { data: lastNewsletter } = await supabaseAdmin
        .from("newsletters")
        .select("sent_at")
        .eq("user_id", profile.id)
        .not("sent_at", "is", null)
        .order("sent_at", { ascending: false })
        .limit(1)
        .single();

      // Nombre de destinataires
      const { count: recipientCount } = await supabaseAdmin
        .from("recipients")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id);

      // IDs des newsletters de cet utilisateur (pour les events)
      const { data: userNewsletters } = await supabaseAdmin
        .from("newsletters")
        .select("id")
        .eq("user_id", profile.id);

      const newsletterIds =
        userNewsletters?.map((n: { id: string }) => n.id) ?? [];

      // Opens
      let opensCount = 0;
      if (newsletterIds.length > 0) {
        const { count } = await supabaseAdmin
          .from("newsletter_events")
          .select("id", { count: "exact", head: true })
          .eq("event_type", "open")
          .in("newsletter_id", newsletterIds);
        opensCount = count ?? 0;
      }

      // Clicks
      let clicksCount = 0;
      if (newsletterIds.length > 0) {
        const { count } = await supabaseAdmin
          .from("newsletter_events")
          .select("id", { count: "exact", head: true })
          .eq("event_type", "click")
          .in("newsletter_id", newsletterIds);
        clicksCount = count ?? 0;
      }

      // Etape lifecycle (dernier email lifecycle envoye)
      const { data: lastLifecycle } = await supabaseAdmin
        .from("lifecycle_emails")
        .select("email_type")
        .eq("user_id", profile.id)
        .order("sent_at", { ascending: false })
        .limit(1)
        .single();

      // Parrain (email du parrain si referred_by existe)
      let referredByEmail: string | undefined;
      if (profile.referred_by) {
        const { data: referrer } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("id", profile.referred_by)
          .single();
        referredByEmail = referrer?.email ?? undefined;
      }

      const userData: NotionUserData = {
        supabaseId: profile.id,
        email: profile.email ?? "",
        fullName: profile.full_name ?? undefined,
        plan: profile.plan ?? "free",
        emailVerified: profile.email_verified ?? false,
        createdAt: profile.created_at ?? new Date().toISOString(),
        trialEndsAt: profile.trial_ends_at ?? undefined,
        stripeCustomerId: profile.stripe_customer_id ?? undefined,
        referredBy: referredByEmail,
        newslettersGenerated: generatedCount ?? 0,
        newslettersSent: sentCount ?? 0,
        lastSentAt: lastNewsletter?.sent_at ?? undefined,
        recipientCount: recipientCount ?? 0,
        opens: opensCount,
        clicks: clicksCount,
        lifecycleStage: lastLifecycle?.email_type ?? "nouveau",
        brief: config?.custom_brief ?? undefined,
        topics: config?.topics
          ? (config.topics as string[]).join(", ")
          : undefined,
        frequency: config?.frequency ?? undefined,
      };

      await syncUserToNotion(userData);
      syncedCount++;
    }

    return syncedCount;
  } catch (error: unknown) {
    if (isDev()) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[notion-sync] syncAllUsersToNotion error:", message);
    }
    return 0;
  }
}

// --- markActivitySynced ---

/**
 * Marque des activites comme synchronisees dans Supabase.
 * Met a jour activity_log.synced_to_notion = true pour les IDs fournis.
 * Fire-and-forget : ne lève jamais d'erreur.
 */
export async function markActivitySynced(
  activityIds: string[]
): Promise<void> {
  try {
    if (activityIds.length === 0) return;

    const { error } = await supabaseAdmin
      .from("activity_log")
      .update({ synced_to_notion: true })
      .in("id", activityIds);

    if (error && isDev()) {
      console.error("[notion-sync] markActivitySynced error:", error.message);
    }
  } catch (error: unknown) {
    if (isDev()) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[notion-sync] markActivitySynced error:", message);
    }
  }
}

// --- syncPendingActivities ---

/**
 * Synchronise les activites en attente (synced_to_notion = false) vers Notion.
 * Limite a 50 par appel pour eviter les timeouts.
 * Retourne le nombre d'activites synchronisees.
 */
export async function syncPendingActivities(): Promise<number> {
  try {
    const notion = getNotionClient();
    if (!notion || !getActivityDatabaseId()) return 0;

    const { data: activities, error } = await supabaseAdmin
      .from("activity_log")
      .select("id, user_id, user_email, action_type, action_label, details")
      .eq("synced_to_notion", false)
      .limit(50);

    if (error || !activities || activities.length === 0) return 0;

    const typedActivities = activities as ActivityLogRow[];
    const syncedIds: string[] = [];

    for (const activity of typedActivities) {
      await logActivityToNotion({
        userId: activity.user_id,
        userEmail: activity.user_email,
        actionType: activity.action_type,
        actionLabel: activity.action_label,
        details: activity.details ?? undefined,
      });
      syncedIds.push(activity.id);
    }

    await markActivitySynced(syncedIds);

    return syncedIds.length;
  } catch (error: unknown) {
    if (isDev()) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[notion-sync] syncPendingActivities error:", message);
    }
    return 0;
  }
}
