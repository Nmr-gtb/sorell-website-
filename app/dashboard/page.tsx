"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { getRecipients, upsertNewsletterConfig } from "@/lib/database";
import Skeleton from "@/components/Skeleton";
import { supabase } from "@/lib/supabase";
import { authFetch } from "@/lib/api";
import { DEFAULT_TOPICS } from "@/lib/topics";
import { useLanguage } from "@/lib/LanguageContext";
import { openSolyBrief } from "@/components/ChatWidget";
import NewsletterLoader from "@/components/NewsletterLoader";
import { PRICE_IDS as STRIPE_PRICE_IDS } from "@/lib/price-ids";

// Depuis le retrait de l'étape « choix du plan » du tunnel, le seul paiement
// déclenché ici est l'essai Pro mensuel proposé sur l'écran de fin.
const PRO_TRIAL_PRICE_ID = STRIPE_PRICE_IDS.pro_monthly;

function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M1 20c0-3.3 3.6-6 8-6" />
      <circle cx="17" cy="9" r="3" />
      <path d="M23 20c0-2.7-2.7-5-6-5" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

const DAY_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

// Retourne aussi dateObj (à l'heure d'envoi) : les comparaisons de dates se
// font sur l'objet Date, jamais sur la chaîne localisée (non parsable en FR).
function getNextDate(frequency: string, sendDay: string, sendHour: number, lang: string = "fr"): { date: string; time: string; dateObj: Date } {
  const now = new Date();
  const locale = lang === "en" ? "en-US" : "fr-FR";
  const timeStr = lang === "en"
    ? `${sendHour > 12 ? sendHour - 12 : sendHour}:00 ${sendHour >= 12 ? "PM" : "AM"}`
    : `${sendHour}h00`;

  function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  let next: Date;
  let dateStr: string;

  if (frequency === "monthly") {
    const targetDate = sendDay === "1st" ? 1 : 15;
    next = new Date(now.getFullYear(), now.getMonth(), targetDate);
    if (next <= now) next.setMonth(next.getMonth() + 1);
    dateStr = next.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  } else if (frequency === "bimonthly") {
    // bimonthly : le 1er et le 15 de chaque mois (aligné sur le cron).
    const candidates = [
      new Date(now.getFullYear(), now.getMonth(), 1),
      new Date(now.getFullYear(), now.getMonth(), 15),
      new Date(now.getFullYear(), now.getMonth() + 1, 1),
    ];
    next = candidates.find((d) => d > now) || candidates[2];
    dateStr = next.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  } else {
    // weekly
    const targetDay = DAY_INDEX[sendDay] ?? 1;
    let diff = (targetDay - now.getDay() + 7) % 7;
    if (diff === 0) diff = 7;
    next = new Date(now);
    next.setDate(now.getDate() + diff);
    dateStr = capitalize(next.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }));
  }

  next.setHours(sendHour, 0, 0, 0);
  return { date: dateStr, time: timeStr, dateObj: next };
}

type Newsletter = {
  id: string;
  subject: string;
  sent_at: string | null;
  generated_at: string | null;
  status: string;
  open_count: number;
  click_count: number;
  recipient_count: number;
  content: unknown;
};

function formatDate(dateStr: string, lang: string = "fr") {
  return new Date(dateStr).toLocaleDateString(lang === "en" ? "en-US" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function countArticles(content: unknown): number | null {
  if (!content) return null;
  if (Array.isArray(content)) return content.length;
  const c = content as Record<string, unknown>;
  if (Array.isArray(c.articles)) return (c.articles as unknown[]).length;
  return null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  // On stocke la planification BRUTE et on formate au rendu (useMemo) : un
  // changement de langue reformate sans re-télécharger quoi que ce soit.
  const [schedule, setSchedule] = useState<{ frequency: string; sendDay: string; sendHour: number } | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [lastNewsletter, setLastNewsletter] = useState<Newsletter | null>(null);
  // Dernier ENVOI réel — la métrique « Taux d'ouverture » se calcule dessus,
  // jamais sur un brouillon (recipient_count 0 → « — » mensonger).
  const [lastSentNewsletter, setLastSentNewsletter] = useState<Newsletter | null>(null);
  const [loadingNewsletter, setLoadingNewsletter] = useState(true);
  // Incrémenté à la fin de l'onboarding pour recharger des données fraîches
  const [reloadTick, setReloadTick] = useState(0);
  const [config, setConfig] = useState<{ custom_brief?: string; edit_mode?: string; pending_draft_id?: string | null } | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  // Onboarding state
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null); // null = loading
  // L'onboarding démarre au brief (l'étape "choix du plan" a été retirée :
  // tout le monde s'inscrit en gratuit, l'upgrade Pro est proposé en fin de
  // parcours, une fois la première newsletter reçue). Les étapes internes
  // gardent les numéros 2..5 ; l'affichage montre "1 sur 4" à "4 sur 4".
  const [onboardingStep, setOnboardingStep] = useState(2);
  const [brief, setBrief] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopics, setCustomTopics] = useState<{ id: string; label: string }[]>([]);
  const [newTopicLabel, setNewTopicLabel] = useState("");
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number>(8);
  const [onboardingSaving, setOnboardingSaving] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");
  // Plan payant (choisi ou en cours de checkout) : les textes d'onboarding
  // annoncent le rythme réel du cron (1er + 15) au lieu du rythme Free (1er)
  const [paidOnboarding, setPaidOnboarding] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  // Erreur du checkout de l'upsell, distincte de onboardingError : un échec de
  // paiement ne doit pas remplacer la confirmation d'envoi de la newsletter.
  const [upsellError, setUpsellError] = useState("");
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendEmailSuccess, setResendEmailSuccess] = useState(false);
  const [resendEmailError, setResendEmailError] = useState("");
  const autoSentRef = useRef(false);

  const searchParams = useSearchParams();
  const emailVerifiedParam = searchParams.get("email_verified");

  // Envoi automatique de l'email de vérification dès que l'écran bloquant s'affiche
  const sendVerificationEmail = useCallback(async () => {
    if (!user?.email) return;
    setResendingEmail(true);
    setResendEmailSuccess(false);
    setResendEmailError("");
    try {
      const res = await authFetch("/api/welcome", {
        method: "POST",
        body: JSON.stringify({ email: user.email, name: user.user_metadata?.full_name || "" }),
      });
      if (res.ok) {
        setResendEmailSuccess(true);
      } else {
        setResendEmailError(lang === "fr" ? "Erreur lors de l'envoi. Réessayez." : "Error sending email. Try again.");
      }
    } catch {
      setResendEmailError(lang === "fr" ? "Erreur lors de l'envoi. Réessayez." : "Error sending email. Try again.");
    }
    setResendingEmail(false);
  }, [user, lang]);

  useEffect(() => {
    if (emailVerified === false && emailVerifiedParam !== "success" && !autoSentRef.current) {
      autoSentRef.current = true;
      sendVerificationEmail();
    }
  }, [emailVerified, emailVerifiedParam, sendVerificationEmail]);

  // Mettre a jour emailVerified si l'utilisateur vient de confirmer via le lien
  useEffect(() => {
    if (emailVerifiedParam === "success") {
      setEmailVerified(true);
    }
  }, [emailVerifiedParam]);

  // Un seul chargement PARALLÈLE pour tout le dashboard. Avant : 3 effets en
  // cascade (config → puis recipients + config re-téléchargée → puis dernière
  // newsletter), re-déclenchés à chaque changement de langue. Désormais : un
  // aller-retour, colonnes explicites (sans original_content), et le
  // formatage de la date se fait au rendu.
  useEffect(() => {
    if (!user) return;

    const fromCheckout = searchParams.get("onboarding") === "true";
    const NEWSLETTER_COLUMNS =
      "id, subject, sent_at, generated_at, status, open_count, click_count, recipient_count, content";

    Promise.all([
      supabase.from("newsletter_config").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("plan, email_verified").eq("id", user.id).single(),
      getRecipients(user.id),
      supabase
        .from("newsletters")
        .select(NEWSLETTER_COLUMNS)
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false })
        .limit(1),
      supabase
        .from("newsletters")
        .select(NEWSLETTER_COLUMNS)
        .eq("user_id", user.id)
        .eq("status", "sent")
        .order("sent_at", { ascending: false })
        .limit(1),
    ]).then(([configResult, profileResult, recipientsResult, lastNlResult, lastSentResult]) => {
      const configData = configResult.data;
      const hasTopics = !!(configData?.topics && configData.topics.length > 0);
      const plan = profileResult.data?.plan || "free";
      setEmailVerified(profileResult.data?.email_verified ?? false);
      const hasPaidPlan = plan === "pro" || plan === "business" || plan === "enterprise";
      setPaidOnboarding(hasPaidPlan || fromCheckout);

      // Onboarding terminé dès que des thématiques existent. Sinon le tunnel
      // démarre au brief (étape 2, valeur par défaut du state) — plus d'étape
      // de choix de plan ni de saut conditionnel après retour Stripe.
      setIsNewUser(!hasTopics);

      setConfig(configData);
      setSchedule({
        frequency: configData?.frequency ?? "weekly",
        sendDay: configData?.send_day ?? "monday",
        sendHour: configData?.send_hour ?? 9,
      });
      setRecipientCount(recipientsResult.data.length);
      setLastNewsletter((lastNlResult.data?.[0] as Newsletter) ?? null);
      setLastSentNewsletter((lastSentResult.data?.[0] as Newsletter) ?? null);
      setLoadingData(false);
      setLoadingNewsletter(false);
    });
  }, [user, searchParams, reloadTick]);

  const nextNewsletter = useMemo(
    () => (schedule ? getNextDate(schedule.frequency, schedule.sendDay, schedule.sendHour, lang) : null),
    [schedule, lang]
  );

  function toggleTopic(id: string) {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function addCustomTopic() {
    const trimmed = newTopicLabel.trim();
    if (!trimmed) return;
    const id = `custom-${Date.now()}`;
    setCustomTopics((prev) => [...prev, { id, label: trimmed }]);
    setSelectedTopics((prev) => [...prev, id]);
    setNewTopicLabel("");
    setShowAddTopic(false);
  }

  function removeCustomTopic(id: string) {
    setCustomTopics((prev) => prev.filter((t) => t.id !== id));
    setSelectedTopics((prev) => prev.filter((t) => t !== id));
  }

  async function handleProTrialCheckout() {
    if (!user) return;
    setCheckoutLoading(true);
    setUpsellError("");
    try {
      const res = await authFetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          priceId: PRO_TRIAL_PRICE_ID,
          fromOnboarding: true,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.alreadySubscribed) {
        window.location.href = "/dashboard/profile?upgraded=true";
      } else {
        // Réponse sans URL de paiement : signaler l'échec au lieu de rendre
        // le bouton inerte sans explication.
        setUpsellError(t("dashboard.checkout_error"));
        setCheckoutLoading(false);
      }
    } catch {
      // Erreur propre à l'upsell : ne pas écraser le message de succès de
      // l'onboarding, qui annonce que la première newsletter est partie.
      setUpsellError(t("dashboard.checkout_error"));
      setCheckoutLoading(false);
    }
  }

  async function handleOnboardingComplete() {
    if (!user) return;
    setOnboardingSaving(true);

    // 1. Save config
    const topicsArray = [
      ...DEFAULT_TOPICS.map((t) => ({
        id: t.id,
        label: t.label,
        enabled: selectedTopics.includes(t.id),
      })),
      ...customTopics.map((t) => ({
        id: t.id,
        label: t.label,
        enabled: true,
      })),
    ];

    await upsertNewsletterConfig(user.id, {
      topics: topicsArray,
      sources: [],
      frequency: "bimonthly",
      custom_brief: brief,
      send_day: "1st-15th",
      send_hour: selectedSlot,
    });

    // 2. Add user email as recipient (via authFetch to ensure server-side insert)
    try {
      await authFetch("/api/recipients", {
        method: "POST",
        body: JSON.stringify({ email: user.email, name: user.user_metadata?.full_name || "" }),
      });
    } catch {
      // fallback: client-side upsert
      await supabase.from("recipients").upsert(
        { user_id: user.id, email: user.email, name: user.user_metadata?.full_name || "" },
        { onConflict: "user_id,email" }
      );
    }

    // 3. Generate and send first newsletter
    try {
      const genRes = await authFetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ userId: user.id }),
      });
      if (genRes.status === 429) {
        setOnboardingError(t("dashboard.rate_limit_error"));
      } else if (!genRes.ok) {
        const errData = await genRes.json().catch(() => null);
        setOnboardingError(errData?.error || t("dashboard.first_newsletter_error"));
      } else {
        const genData = await genRes.json();
        if (genData.newsletter) {
          const sendRes = await authFetch("/api/send", {
            method: "POST",
            body: JSON.stringify({ newsletterId: genData.newsletter.id, userId: user.id }),
          });
          if (!sendRes.ok) {
            setOnboardingError(t("dashboard.first_newsletter_error"));
          }
        } else {
          setOnboardingError(t("dashboard.first_newsletter_error"));
        }
      }
    } catch {
      setOnboardingError(t("dashboard.first_newsletter_error"));
    }

    // Welcome email deja envoye au moment de la creation du compte (auth/callback)
    // Ne pas le renvoyer ici pour eviter le doublon

    setOnboardingSaving(false);
    setOnboardingComplete(true);
  }

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "vous";

  // Taux d'ouverture du dernier ENVOI (jamais d'un brouillon), plafonné à
  // 100 % par sécurité si le compteur dépasse le nombre de destinataires.
  const lastOpenRate =
    lastSentNewsletter && lastSentNewsletter.recipient_count > 0
      ? Math.min(100, Math.round((lastSentNewsletter.open_count / lastSentNewsletter.recipient_count) * 100))
      : null;

  const lastArticleCount = lastNewsletter ? countArticles(lastNewsletter.content) : null;

  // metrics are now inline in the JSX (3 cards instead of 4)

  // Loading state while checking if new user
  if (isNewUser === null) {
    return (
      <div style={{ padding: "32px", maxWidth: 900 }}>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{t("common.loading")}</p>
      </div>
    );
  }

  // ── ECRAN BLOCANT : VERIFICATION EMAIL ───────────────────────────
  if (emailVerified === false && emailVerifiedParam !== "success") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: resendEmailSuccess ? "rgba(5, 150, 105, 0.1)" : "rgba(245, 158, 11, 0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          transition: "background 0.3s ease",
        }}>
          {resendEmailSuccess ? (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          )}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>
          {resendEmailSuccess
            ? (lang === "fr" ? "Email envoyé" : "Email sent")
            : resendingEmail
              ? (lang === "fr" ? "Envoi en cours..." : "Sending...")
              : (lang === "fr" ? "Vérifiez votre boîte mail" : "Check your inbox")}
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>
          {resendEmailSuccess
            ? (lang === "fr"
              ? "Un email de confirmation vient d'être envoyé à :"
              : "A confirmation email was just sent to:")
            : (lang === "fr"
              ? "Envoi de l'email de confirmation à :"
              : "Sending confirmation email to:")}
        </p>
        <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 24 }}>
          {user?.email}
        </p>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 32 }}>
          {lang === "fr"
            ? "Cliquez sur le lien dans l'email pour confirmer votre adresse et accéder à votre espace. Pensez à vérifier vos spams."
            : "Click the link in the email to confirm your address and access your dashboard. Check your spam folder."}
        </p>
        {resendEmailError && (
          <p style={{ fontSize: 13, color: "var(--error)", marginBottom: 12 }}>{resendEmailError}</p>
        )}
        <button
          onClick={sendVerificationEmail}
          disabled={resendingEmail}
          style={{
            padding: "12px 28px",
            background: resendingEmail ? "var(--border)" : resendEmailSuccess ? "#059669" : "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: resendingEmail ? "not-allowed" : "pointer",
            transition: "background 0.2s ease",
          }}
        >
          {resendingEmail
            ? (lang === "fr" ? "Envoi en cours..." : "Sending...")
            : resendEmailSuccess
              ? (lang === "fr" ? "Renvoyer l'email" : "Resend email")
              : (lang === "fr" ? "Renvoyer l'email" : "Resend email")}
        </button>
        {resendEmailSuccess && (
          <p style={{ fontSize: 13, color: "#059669", marginTop: 12 }}>
            {lang === "fr" ? "Vérifiez votre boîte mail, pensez aux spams." : "Check your inbox, including spam."}
          </p>
        )}
      </div>
    );
  }

  // ── ONBOARDING WIZARD ────────────────────────────────────────────
  if (isNewUser) {
    // Success screen
    if (onboardingComplete) {
      return (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
            {t("dashboard.onboarding_complete_title")}
          </h1>
          {onboardingError ? (
            <p style={{ fontSize: 15, color: "#EF4444", marginBottom: 24, lineHeight: 1.6 }}>
              {onboardingError}
            </p>
          ) : (
            <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
              {t(paidOnboarding ? "dashboard.onboarding_complete_desc_paid" : "dashboard.onboarding_complete_desc")}
            </p>
          )}
          <button
            onClick={() => {
              // Recharger les données du dashboard : elles ont été chargées au
              // montage, quand le compte était vide (config, destinataires et
              // première newsletter viennent d'être créés par l'onboarding).
              setLoadingData(true);
              setLoadingNewsletter(true);
              setReloadTick((tick) => tick + 1);
              setIsNewUser(false);
            }}
            style={{ padding: "12px 32px", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
          >
            {t("dashboard.onboarding_view_dashboard")}
          </button>

          {/* Upsell Pro — proposé APRÈS le "aha" (première newsletter reçue),
              une fois l'onboarding gratuit terminé. Réutilise le checkout Stripe
              existant : plus de redirection en plein tunnel. */}
          <div style={{
            marginTop: 32,
            padding: "20px",
            background: "rgba(0, 80, 88, 0.05)",
            border: "1px solid rgba(0, 80, 88, 0.15)",
            borderRadius: 12,
            textAlign: "left",
          }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "0 0 6px" }}>
              {t("dashboard.upsell_title")}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 16px" }}>
              {t("dashboard.upsell_desc")}
            </p>
            <button
              onClick={handleProTrialCheckout}
              disabled={checkoutLoading}
              style={{
                padding: "10px 24px",
                background: "var(--accent)",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: checkoutLoading ? "wait" : "pointer",
                opacity: checkoutLoading ? 0.7 : 1,
              }}
            >
              {checkoutLoading ? t("dashboard.generating") : t("dashboard.upsell_cta")}
            </button>
            {upsellError && (
              <p role="alert" style={{ fontSize: 13, color: "#EF4444", lineHeight: 1.5, margin: "12px 0 0" }}>
                {upsellError}
              </p>
            )}
          </div>

          <div style={{
            marginTop: 20,
            padding: "16px 20px",
            background: "rgba(245, 158, 11, 0.06)",
            border: "1px solid rgba(245, 158, 11, 0.15)",
            borderRadius: 10,
            textAlign: "left",
          }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>
                {lang === "fr" ? "Vous ne trouvez pas l'email ?" : "Can't find the email?"}
              </span>
              {" "}
              {lang === "fr"
                ? "Vérifiez votre dossier indésirables (spam). Pour ne plus rien manquer, ajoutez "
                : "Check your spam folder. To never miss an email, add "}
              <span style={{ fontWeight: 600, color: "var(--accent)" }}>newsletters@sorell.fr</span>
              {lang === "fr" ? " à vos contacts." : " to your contacts."}
            </p>
          </div>
        </div>
      );
    }

    // Step 2 – Brief
    if (onboardingStep === 2) {
      return (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>{t("dashboard.step_of").replace("{n}", "1")}</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
            {t("dashboard.step2_title")}
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
            {t("dashboard.step2_desc")}
          </p>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder={t("dashboard.step2_placeholder")}
            style={{
              width: "100%",
              minHeight: 160,
              padding: 16,
              fontSize: 14,
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              resize: "vertical",
              lineHeight: 1.6,
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={() => openSolyBrief((generatedBrief) => setBrief(generatedBrief))}
            style={{
              marginTop: 16,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: "var(--accent)",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 18 }}>✦</span>
            {t("dashboard.step2_soly_help")}
          </button>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12, textAlign: "left", lineHeight: 1.6 }}>
            <p style={{ marginBottom: 6, fontWeight: 600, color: "var(--text-secondary)" }}>{t("dashboard.step2_tip_title")}</p>
            <p style={{ margin: 0 }}>{t("dashboard.step2_tip_desc")}</p>
          </div>
          <button
            onClick={() => setOnboardingStep(3)}
            disabled={!brief.trim()}
            style={{
              marginTop: 24,
              padding: "12px 32px",
              background: brief.trim() ? "var(--accent)" : "var(--border)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: brief.trim() ? "pointer" : "not-allowed",
            }}
          >
            {t("dashboard.continue")}
          </button>
        </div>
      );
    }

    // Step 3 – Topics
    if (onboardingStep === 3) {
      return (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>{t("dashboard.step_of").replace("{n}", "2")}</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
            {t("dashboard.step3_title")}
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 24 }}>
            {t("dashboard.step3_desc")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 16 }}>
            {DEFAULT_TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => toggleTopic(topic.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: selectedTopics.includes(topic.id) ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: selectedTopics.includes(topic.id) ? "rgba(0,80,88,0.08)" : "var(--surface)",
                  color: selectedTopics.includes(topic.id) ? "var(--accent)" : "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {topic.label}
              </button>
            ))}
            {customTopics.map((topic) => (
              <span
                key={topic.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "8px 12px",
                  borderRadius: 20,
                  border: "2px solid var(--accent)",
                  background: "rgba(0,80,88,0.08)",
                  color: "var(--accent)",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {topic.label}
                <button
                  onClick={() => removeCustomTopic(topic.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    lineHeight: 1,
                    color: "var(--accent)",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label={t("dashboard.delete")}
                >
                  x
                </button>
              </span>
            ))}
          </div>
          <div style={{ marginBottom: 24 }}>
            {showAddTopic ? (
              <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
                <input
                  className="input-field"
                  value={newTopicLabel}
                  onChange={(e) => setNewTopicLabel(e.target.value)}
                  placeholder="Ex: Blockchain, Supply Chain, IoT..."
                  onKeyDown={(e) => e.key === "Enter" && addCustomTopic()}
                  autoFocus
                  style={{ maxWidth: 260, fontSize: 13 }}
                />
                <button
                  className="btn-primary"
                  onClick={addCustomTopic}
                  disabled={!newTopicLabel.trim()}
                  style={{ fontSize: 13, padding: "6px 14px" }}
                >
                  {t("dashboard.add")}
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => { setShowAddTopic(false); setNewTopicLabel(""); }}
                  style={{ fontSize: 13, padding: "6px 14px" }}
                >
                  {t("dashboard.cancel")}
                </button>
              </div>
            ) : (
              <button
                className="btn-ghost"
                onClick={() => setShowAddTopic(true)}
                style={{ fontSize: 13, padding: "6px 14px" }}
              >
                {t("dashboard.add_topic")}
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => setOnboardingStep(2)}
              style={{ padding: "12px 24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, color: "var(--text-secondary)", cursor: "pointer" }}
            >
              {t("dashboard.back")}
            </button>
            <button
              onClick={() => setOnboardingStep(4)}
              disabled={selectedTopics.length === 0}
              style={{ padding: "12px 32px", background: selectedTopics.length > 0 ? "var(--accent)" : "var(--border)", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: selectedTopics.length > 0 ? "pointer" : "not-allowed" }}
            >
              {t("dashboard.continue")}
            </button>
          </div>
        </div>
      );
    }

    // Step 4 – Recipient email
    if (onboardingStep === 4) {
      return (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>{t("dashboard.step_of").replace("{n}", "3")}</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
            {t("dashboard.step4_title")}
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 24 }}>
            {t("dashboard.step4_desc")}
          </p>
          <div style={{
            padding: "12px 16px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 14,
            color: "var(--text)",
            marginBottom: 24,
          }}>
            {user?.email}
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {t("dashboard.step4_note")}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
            <button
              onClick={() => setOnboardingStep(3)}
              style={{ padding: "12px 24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, color: "var(--text-secondary)", cursor: "pointer" }}
            >
              {t("dashboard.back")}
            </button>
            <button
              onClick={() => setOnboardingStep(5)}
              style={{ padding: "12px 32px", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
            >
              {t("dashboard.continue")}
            </button>
          </div>
        </div>
      );
    }

    // Step 5 – Send slot + launch
    if (onboardingStep === 5) {
      return (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>{t("dashboard.step_of").replace("{n}", "4")}</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
            {t("dashboard.step5_title")}
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 24 }}>
            {t("dashboard.step5_desc")}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
            {[
              { label: t("dashboard.slot_morning"), value: 8 },
              { label: t("dashboard.slot_noon"), value: 12 },
              { label: t("dashboard.slot_evening"), value: 18 },
            ].map((slot) => (
              <button
                key={slot.value}
                onClick={() => setSelectedSlot(slot.value)}
                style={{
                  padding: "16px 24px",
                  borderRadius: 10,
                  border: selectedSlot === slot.value ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: selectedSlot === slot.value ? "rgba(0,80,88,0.08)" : "var(--surface)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  color: "var(--text)",
                }}
              >
                {slot.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
            {t(paidOnboarding ? "dashboard.step5_note_paid" : "dashboard.step5_note")}
          </p>
          {onboardingSaving ? (
            <NewsletterLoader active={onboardingSaving} style={{ marginBottom: 12 }} />
          ) : (
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setOnboardingStep(4)}
                style={{ padding: "12px 24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, color: "var(--text-secondary)", cursor: "pointer" }}
              >
                {t("dashboard.back")}
              </button>
              <button
                onClick={handleOnboardingComplete}
                style={{ padding: "12px 32px", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
              >
                {t("dashboard.receive_first")}
              </button>
            </div>
          )}
        </div>
      );
    }
  }

  // ── NORMAL DASHBOARD (Redesign V2 - Musemind style) ──────────────

  const briefDone = !!(config?.custom_brief && config.custom_brief.length >= 20);
  const recipientsDone = (recipientCount ?? 0) > 0;
  const newsletterDone = !!lastNewsletter;
  const checklistSteps = [
    { done: briefDone, label: t("dashboard.checklist_brief"), href: "/dashboard/config" },
    { done: recipientsDone, label: t("dashboard.checklist_recipients"), href: "/dashboard/config" },
    { done: newsletterDone, label: t("dashboard.checklist_generate"), href: "/dashboard/generate" },
  ];
  const completedSteps = checklistSteps.filter((s) => s.done).length;
  const showChecklist = !loadingData && !loadingNewsletter && completedSteps < 3;

  // Contextual greeting message
  const getContextualMessage = (): string => {
    if (!briefDone) return t("dashboard.ctx_complete_brief");
    if (!recipientsDone) return t("dashboard.ctx_add_recipients");
    if (!newsletterDone) return t("dashboard.ctx_generate_first");
    if (nextNewsletter) {
      // Comparaison sur l'objet Date (la chaîne localisée FR n'est pas parsable)
      const diffMs = nextNewsletter.dateObj.getTime() - Date.now();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours > 0 && diffHours < 24) return t("dashboard.ctx_sending_soon");
    }
    if (lastOpenRate !== null && lastOpenRate >= 50) return t("dashboard.ctx_good_performance").replace("{rate}", String(lastOpenRate));
    return t("dashboard.ctx_all_good");
  };

  const isFullySetUp = briefDone && recipientsDone && newsletterDone;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 960 }} className="dashboard-page-container">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", margin: 0 }}>
            {t("dashboard.greeting")}, {firstName}
          </h1>
          {!loadingData && !loadingNewsletter && isFullySetUp && (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 9999,
              background: "#ECFDF5",
              fontSize: 12,
              fontWeight: 500,
              color: "#059669",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669" }} />
              {t("dashboard.status_active")}
            </span>
          )}
        </div>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          {loadingData || loadingNewsletter ? t("dashboard.summary") : getContextualMessage()}
        </p>
      </div>

      {emailVerifiedParam === "success" && (
        <div style={{
          background: "#ECFDF5",
          border: "1px solid #059669",
          borderRadius: 10,
          padding: "14px 20px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 14,
          color: "#065F46",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>
            {lang === "fr"
              ? "Adresse email confirmee. Vos newsletters seront envoyees automatiquement."
              : "Email address confirmed. Your newsletters will be sent automatically."}
          </span>
        </div>
      )}

      {/* Brouillon en attente de validation (mode éditeur) */}
      {config?.edit_mode === "editor" && config?.pending_draft_id && (
        <Link
          href="/dashboard/editor"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            background: "rgba(0,80,88,0.05)",
            border: "1px solid rgba(0,80,88,0.2)",
            borderRadius: 10,
            padding: "14px 20px",
            marginBottom: 16,
            textDecoration: "none",
            transition: "background 0.15s ease",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>
              <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                {t("dashboard.pending_draft_title")}
              </span>
              <span style={{ display: "block", fontSize: 13, color: "var(--text-secondary)" }}>
                {t("dashboard.pending_draft_desc")}
              </span>
            </span>
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", whiteSpace: "nowrap" }}>
            {t("dashboard.pending_draft_cta")} →
          </span>
        </Link>
      )}

      {/* Checklist de progression */}
      {showChecklist && (
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          marginBottom: 24,
          overflow: "hidden",
        }}>
          {/* Progress bar */}
          <div style={{ height: 4, background: "var(--border)" }}>
            <div style={{
              height: 4,
              width: `${(completedSteps / 3) * 100}%`,
              background: "var(--accent)",
              borderRadius: completedSteps < 3 ? "0" : undefined,
              transition: "width 0.3s ease",
            }} />
          </div>
          <div style={{ display: "flex", padding: "16px 20px", gap: 24, flexWrap: "wrap" }}>
            {checklistSteps.map((step) => (
              <Link
                key={step.label}
                href={step.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 500,
                  color: step.done ? "#059669" : "var(--text-muted)",
                }}
              >
                {step.done ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="16 10 11 15 8 12" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
                {step.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 3 Metric cards */}
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}
        className="dashboard-metrics-grid"
      >
        {/* Prochain envoi */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
        }}>
          <div style={{ color: "var(--text-muted)", marginBottom: 12, display: "flex" }}>
            <IconCalendar />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
            {loadingData ? (
              <Skeleton width={150} height={22} />
            ) : (
              <>
                <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
                  {nextNewsletter?.date ?? "—"}
                </span>
                {nextNewsletter?.time && (
                  <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{nextNewsletter.time}</span>
                )}
              </>
            )}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("dashboard.metric_next_newsletter")}</div>
        </div>

        {/* Destinataires */}
        <Link href="/dashboard/config" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 24,
            cursor: "pointer",
            height: "100%",
          }}>
            <div style={{ color: "var(--text-muted)", marginBottom: 12, display: "flex" }}>
              <IconUsers />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
              {loadingData ? (
                <Skeleton width={60} height={22} />
              ) : (
                <>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
                    {String(recipientCount ?? 0)}
                  </span>
                  <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{t("dashboard.metric_collaborators")}</span>
                </>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("dashboard.metric_recipients")}</div>
            <span style={{ fontSize: 12, color: "var(--accent)", marginTop: 4, display: "block" }}>{t("dashboard.manage")}</span>
          </div>
        </Link>

        {/* Taux d'ouverture */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
        }}>
          <div style={{ color: "var(--text-muted)", marginBottom: 12, display: "flex" }}>
            <IconEye />
          </div>
          {loadingNewsletter ? (
            <Skeleton width={60} height={22} style={{ marginBottom: 4 }} />
          ) : (
            <span style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)", letterSpacing: "-0.02em", display: "block", marginBottom: 4 }}>
              {lastOpenRate !== null ? `${lastOpenRate}%` : "—"}
            </span>
          )}
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("dashboard.metric_open_rate")}</div>
        </div>
      </div>

      {/* Derniere newsletter */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}>
        <h2 style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-muted)",
          letterSpacing: "0.08em",
          marginBottom: 16,
        }}>
          {t("dashboard.last_newsletter")}
        </h2>
        {loadingNewsletter ? (
          <div>
            <Skeleton width="70%" height={18} style={{ marginBottom: 10 }} />
            <Skeleton width={220} height={13} style={{ marginBottom: 14 }} />
            <Skeleton width={160} height={22} radius={9999} />
          </div>
        ) : lastNewsletter === null ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 7l10 7 10-7" />
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
              {t("dashboard.no_newsletter")}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
              {t("dashboard.no_newsletter_desc")}
            </p>
            <Link
              href="/dashboard/generate"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: "var(--accent)",
                color: "white",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {t("dashboard.generate_first")}
            </Link>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 6, lineHeight: 1.4 }}>
              {lastNewsletter.subject || "—"}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
              {lastNewsletter.sent_at
                ? `${t("dashboard.sent_date")} ${formatDate(lastNewsletter.sent_at, lang)}`
                : lastNewsletter.generated_at
                ? `${t("dashboard.generated_date")} ${formatDate(lastNewsletter.generated_at, lang)}`
                : ""}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 9999,
                background: lastNewsletter.status === "sent" ? "#ECFDF5" : "#FEF3C7",
                fontSize: 12,
                fontWeight: 500,
                color: lastNewsletter.status === "sent" ? "#059669" : "#D97706",
              }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: lastNewsletter.status === "sent" ? "#059669" : "#D97706",
                }} />
                {lastNewsletter.status === "sent" ? t("dashboard.nl_sent") : t("dashboard.nl_draft")}
              </span>
              {/* lastOpenRate porte sur le dernier ENVOI : ne l'afficher que
                  si la newsletter montrée est bien celle-là (pas un brouillon) */}
              {lastNewsletter.status === "sent" && lastOpenRate !== null && (
                <>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>·</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                    {lastOpenRate}% {t("dashboard.nl_opened")}
                  </span>
                </>
              )}
              {lastNewsletter.click_count > 0 && (
                <>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>·</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                    {lastNewsletter.click_count} {t("dashboard.nl_clicks")}
                  </span>
                </>
              )}
              {lastArticleCount !== null && (
                <>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>·</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                    {lastArticleCount} {t("dashboard.nl_articles")}
                  </span>
                </>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Le détail d'une newsletter se lit dans l'historique — pas sur
                  le formulaire de génération, qui ne l'affiche jamais. */}
              <Link href={`/dashboard/historique?id=${lastNewsletter.id}`} style={{ fontSize: 13, fontWeight: 500, color: "var(--accent)", textDecoration: "none" }}>
                {t("dashboard.view_detail")}
              </Link>
              <Link href="/dashboard/historique" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", textDecoration: "none" }}>
                {t("dashboard.view_all_history")}
              </Link>
            </div>
          </>
        )}
      </div>

      {/* CTA principal */}
      <Link
        href="/dashboard/generate"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          width: "100%",
          padding: "16px 24px",
          background: "var(--accent)",
          color: "white",
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 600,
          textDecoration: "none",
          marginBottom: 24,
          transition: "opacity 0.15s ease",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.88"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
        </svg>
        {t("dashboard.action_generate")}
      </Link>

      {/* Actions rapides */}
      <h2 style={{
        fontSize: 11,
        fontWeight: 600,
        color: "var(--text-muted)",
        letterSpacing: "0.08em",
        marginBottom: 12,
      }}>
        {t("dashboard.quick_actions")}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="dashboard-actions-grid">
        <Link
          href="/dashboard/config"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "16px 20px",
            textDecoration: "none",
            transition: "border-color 0.15s ease, background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-hover)";
            (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface)";
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>
              {t("dashboard.action_configure")}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {t("dashboard.action_config_desc")}
            </div>
          </div>
          <span style={{ color: "var(--text-muted)", flexShrink: 0, marginLeft: 12 }}>
            <IconArrow />
          </span>
        </Link>
        <Link
          href="/dashboard/analytics"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "16px 20px",
            textDecoration: "none",
            transition: "border-color 0.15s ease, background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-hover)";
            (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface)";
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>
              {t("dashboard.action_analytics")}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {t("dashboard.action_analytics_desc")}
            </div>
          </div>
          <span style={{ color: "var(--text-muted)", flexShrink: 0, marginLeft: 12 }}>
            <IconArrow />
          </span>
        </Link>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-page-container {
            padding: 20px 16px !important;
          }
          .dashboard-metrics-grid {
            grid-template-columns: 1fr !important;
          }
          .dashboard-actions-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
