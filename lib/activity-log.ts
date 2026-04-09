/**
 * Activity Log - Module centralisé de journalisation des actions utilisateur.
 * Insert dans la table activity_log (Supabase) + sync optionnelle vers Notion.
 * Toutes les fonctions sont fire-and-forget : elles ne throw JAMAIS.
 */

import { supabaseAdmin } from "@/lib/supabase-admin";
import { logActivityToNotion } from "@/lib/notion-sync";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface LogActivityParams {
  userId?: string;
  userEmail: string;
  type: ActivityType;
  label: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Fonction principale
// ---------------------------------------------------------------------------

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const { userId, userEmail, type, label, details, metadata } = params;

    const { error } = await supabaseAdmin.from("activity_log").insert({
      user_id: userId ?? null,
      user_email: userEmail,
      action_type: type,
      action_label: label,
      details: details ?? null,
      metadata: metadata ?? {},
      synced_to_notion: false,
    });

    if (error && process.env.NODE_ENV !== "production") {
      console.error("[activity-log] Erreur Supabase :", error.message);
    }

    // Fire-and-forget vers Notion
    logActivityToNotion({
      userId: userId ?? "",
      userEmail,
      actionType: type,
      actionLabel: label,
      details,
    }).catch(() => {
      // Ne pas faire echouer le flow principal
    });
  } catch {
    // Ne jamais faire echouer le flow principal
  }
}

// ---------------------------------------------------------------------------
// Fonctions de convenance
// ---------------------------------------------------------------------------

export async function logSignup(
  userId: string,
  email: string,
  fullName?: string
): Promise<void> {
  try {
    await logActivity({
      userId,
      userEmail: email,
      type: "inscription",
      label: "Nouvelle inscription",
      details: fullName ? `Nom : ${fullName}` : undefined,
      metadata: fullName ? { full_name: fullName } : undefined,
    });
  } catch {
    // Ne jamais throw
  }
}

export async function logEmailVerified(
  userId: string,
  email: string
): Promise<void> {
  try {
    await logActivity({
      userId,
      userEmail: email,
      type: "verification_email",
      label: "Email verifie",
    });
  } catch {
    // Ne jamais throw
  }
}

export async function logPlanChange(
  userId: string,
  email: string,
  oldPlan: string,
  newPlan: string
): Promise<void> {
  try {
    await logActivity({
      userId,
      userEmail: email,
      type: "changement_plan",
      label: `Passage du plan ${oldPlan} au plan ${newPlan}`,
      details: `${oldPlan} -> ${newPlan}`,
      metadata: { old_plan: oldPlan, new_plan: newPlan },
    });
  } catch {
    // Ne jamais throw
  }
}

export async function logPaymentFailed(
  userId: string,
  email: string,
  details?: string
): Promise<void> {
  try {
    await logActivity({
      userId,
      userEmail: email,
      type: "paiement_echoue",
      label: "Paiement echoue",
      details,
    });
  } catch {
    // Ne jamais throw
  }
}

export async function logNewsletterGenerated(
  userId: string,
  email: string,
  subject?: string
): Promise<void> {
  try {
    await logActivity({
      userId,
      userEmail: email,
      type: "generation_newsletter",
      label: "Newsletter generee",
      details: subject ? `Sujet : ${subject}` : undefined,
      metadata: subject ? { subject } : undefined,
    });
  } catch {
    // Ne jamais throw
  }
}

export async function logNewsletterSent(
  userId: string,
  email: string,
  recipientCount: number,
  subject?: string
): Promise<void> {
  try {
    await logActivity({
      userId,
      userEmail: email,
      type: "envoi_newsletter",
      label: `Newsletter envoyee a ${recipientCount} destinataire${recipientCount > 1 ? "s" : ""}`,
      details: subject ? `Sujet : ${subject}` : undefined,
      metadata: { recipient_count: recipientCount, ...(subject ? { subject } : {}) },
    });
  } catch {
    // Ne jamais throw
  }
}

export async function logEmailOpen(
  userId: string,
  email: string,
  newsletterId: string
): Promise<void> {
  try {
    await logActivity({
      userId,
      userEmail: email,
      type: "ouverture_email",
      label: "Email ouvert",
      metadata: { newsletter_id: newsletterId },
    });
  } catch {
    // Ne jamais throw
  }
}

export async function logEmailClick(
  userId: string,
  email: string,
  newsletterId: string,
  url?: string
): Promise<void> {
  try {
    await logActivity({
      userId,
      userEmail: email,
      type: "clic_email",
      label: "Clic dans un email",
      details: url ? `URL : ${url}` : undefined,
      metadata: { newsletter_id: newsletterId, ...(url ? { url } : {}) },
    });
  } catch {
    // Ne jamais throw
  }
}

export async function logBounce(
  userId: string,
  email: string,
  bouncedEmail: string
): Promise<void> {
  try {
    await logActivity({
      userId,
      userEmail: email,
      type: "bounce",
      label: "Bounce detecte",
      details: `Email en bounce : ${bouncedEmail}`,
      metadata: { bounced_email: bouncedEmail },
    });
  } catch {
    // Ne jamais throw
  }
}

export async function logRecipientAdded(
  userId: string,
  email: string,
  recipientEmail: string
): Promise<void> {
  try {
    await logActivity({
      userId,
      userEmail: email,
      type: "ajout_destinataire",
      label: "Destinataire ajoute",
      details: recipientEmail,
      metadata: { recipient_email: recipientEmail },
    });
  } catch {
    // Ne jamais throw
  }
}

export async function logRecipientRemoved(
  userId: string,
  email: string,
  recipientEmail: string
): Promise<void> {
  try {
    await logActivity({
      userId,
      userEmail: email,
      type: "suppression_destinataire",
      label: "Destinataire supprime",
      details: recipientEmail,
      metadata: { recipient_email: recipientEmail },
    });
  } catch {
    // Ne jamais throw
  }
}

export async function logConfigChange(
  userId: string,
  email: string,
  field: string,
  details?: string
): Promise<void> {
  try {
    await logActivity({
      userId,
      userEmail: email,
      type: "changement_config",
      label: `Configuration modifiee : ${field}`,
      details,
      metadata: { field },
    });
  } catch {
    // Ne jamais throw
  }
}

export async function logLifecycleEmail(
  userId: string,
  email: string,
  emailType: string
): Promise<void> {
  try {
    await logActivity({
      userId,
      userEmail: email,
      type: "email_lifecycle",
      label: `Email lifecycle envoye : ${emailType}`,
      metadata: { email_type: emailType },
    });
  } catch {
    // Ne jamais throw
  }
}

export async function logReferralConverted(
  userId: string,
  email: string,
  refereeEmail: string
): Promise<void> {
  try {
    await logActivity({
      userId,
      userEmail: email,
      type: "conversion_parrainage",
      label: "Parrainage converti",
      details: `Filleul : ${refereeEmail}`,
      metadata: { referee_email: refereeEmail },
    });
  } catch {
    // Ne jamais throw
  }
}

export async function logAccountDeleted(
  userId: string,
  email: string
): Promise<void> {
  try {
    await logActivity({
      userId,
      userEmail: email,
      type: "suppression_compte",
      label: "Compte supprime",
    });
  } catch {
    // Ne jamais throw
  }
}
