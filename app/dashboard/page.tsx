"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { getRecipients, getNewsletterConfig, upsertNewsletterConfig } from "@/lib/database";
import { supabase } from "@/lib/supabase";
import { authFetch } from "@/lib/api";
import { DEFAULT_TOPICS } from "@/lib/topics";
import { useLanguage } from "@/lib/LanguageContext";
import { openSolyBrief } from "@/components/ChatWidget";

const PRICE_IDS: Record<string, Record<string, string>> = {
  pro: {
    monthly: "price_1TE3pa7A2mOEJEeWltqInvgW",
    annual: "price_1TE3ps7A2mOEJEeW4m1wm00z",
  },
  business: {
    monthly: "price_1TE3qf7A2mOEJEeWiTAz8oWd",
    annual: "price_1TE3qv7A2mOEJEeWEB04fuCE",
  },
};

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

const DAYS: Record<string, string[]> = {
  fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};
const MONTHS: Record<string, string[]> = {
  fr: ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

const DAY_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function getNextDate(frequency: string, sendDay: string, sendHour: number, lang: string = "fr"): { date: string; time: string } {
  const now = new Date();
  const today = now.getDay();
  const timeStr = lang === "en" ? `${sendHour > 12 ? sendHour - 12 : sendHour}:00 ${sendHour >= 12 ? "PM" : "AM"}` : `${sendHour}h00`;
  const months = MONTHS[lang] || MONTHS["fr"];
  const days = DAYS[lang] || DAYS["fr"];

  if (frequency === "monthly") {
    const targetDate = sendDay === "1st" ? 1 : 15;
    const next = new Date(now.getFullYear(), now.getMonth(), targetDate);
    if (next <= now) next.setMonth(next.getMonth() + 1);
    return {
      date: lang === "en"
        ? `${months[next.getMonth()]} ${next.getDate()}, ${next.getFullYear()}`
        : `${next.getDate()} ${months[next.getMonth()]} ${next.getFullYear()}`,
      time: timeStr,
    };
  }

  // weekly
  const targetDay = DAY_INDEX[sendDay] ?? 1;
  let diff = (targetDay - today + 7) % 7;
  if (diff === 0) diff = 7;
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  const day = days[next.getDay()];
  return {
    date: lang === "en"
      ? `${day} ${months[next.getMonth()]} ${next.getDate()}`
      : `${day.charAt(0).toUpperCase() + day.slice(1)} ${next.getDate()} ${months[next.getMonth()]}`,
    time: timeStr,
  };
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
  const [nextNewsletter, setNextNewsletter] = useState<{ date: string; time: string } | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [lastNewsletter, setLastNewsletter] = useState<Newsletter | null>(null);
  const [loadingNewsletter, setLoadingNewsletter] = useState(true);
  const [config, setConfig] = useState<{ custom_brief?: string } | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  // Onboarding state
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null); // null = loading
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [brief, setBrief] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopics, setCustomTopics] = useState<{ id: string; label: string }[]>([]);
  const [newTopicLabel, setNewTopicLabel] = useState("");
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number>(8);
  const [onboardingSaving, setOnboardingSaving] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  const searchParams = useSearchParams();
  const emailVerifiedParam = searchParams.get("email_verified");

  // Mettre a jour emailVerified si l'utilisateur vient de confirmer via le lien
  useEffect(() => {
    if (emailVerifiedParam === "success") {
      setEmailVerified(true);
    }
  }, [emailVerifiedParam]);

  // Check if new user (no topics configured), and skip plan step if returning from checkout or already on paid plan
  useEffect(() => {
    if (!user) return;

    const fromCheckout = searchParams.get("onboarding") === "true";

    Promise.all([
      supabase
        .from("newsletter_config")
        .select("topics, custom_brief")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("profiles")
        .select("plan, email_verified")
        .eq("id", user.id)
        .single(),
    ]).then(([configResult, profileResult]) => {
      const hasTopics = !!(configResult.data?.topics && configResult.data.topics.length > 0);
      const plan = profileResult.data?.plan || "free";
      setEmailVerified(profileResult.data?.email_verified ?? false);
      const hasPaidPlan = plan === "pro" || plan === "business" || plan === "enterprise";

      if (hasTopics) {
        setIsNewUser(false);
      } else {
        setIsNewUser(true);
        // Skip plan step if returning from Stripe checkout or already on a paid plan
        if (fromCheckout || hasPaidPlan) {
          setOnboardingStep(2);
        }
      }
    });
  }, [user, searchParams]);

  useEffect(() => {
    if (!user || isNewUser !== false) return;

    async function loadData() {
      const [recipientsResult, configResult] = await Promise.all([
        getRecipients(user!.id),
        getNewsletterConfig(user!.id),
      ]);

      setRecipientCount(recipientsResult.data.length);
      setConfig(configResult.data);

      const freq = configResult.data?.frequency ?? "weekly";
      const day = configResult.data?.send_day ?? "monday";
      const hour = configResult.data?.send_hour ?? 9;
      setNextNewsletter(getNextDate(freq, day, hour, lang));

      setLoadingData(false);
    }

    loadData();
  }, [user, isNewUser, lang]);

  useEffect(() => {
    if (!user || isNewUser !== false) return;

    supabase
      .from("newsletters")
      .select("*")
      .eq("user_id", user.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLastNewsletter(data[0] as Newsletter);
        }
        setLoadingNewsletter(false);
      });
  }, [user, isNewUser]);

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

  async function handlePlanCheckout(planKey: "pro" | "business") {
    if (!user) return;
    const priceId = PRICE_IDS[planKey][billingPeriod];
    setCheckoutLoading(true);
    try {
      const res = await authFetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          priceId,
          fromOnboarding: true,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutLoading(false);
      }
    } catch {
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

    // 2. Add user email as recipient
    await supabase.from("recipients").upsert(
      {
        user_id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || "",
      },
      { onConflict: "user_id,email" }
    );

    // 3. Generate and send first newsletter
    try {
      const genRes = await authFetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ userId: user.id }),
      });
      if (genRes.status === 429) {
        setOnboardingError(t("dashboard.rate_limit_error"));
      } else {
        const genData = await genRes.json();
        if (genData.newsletter) {
          await authFetch("/api/send", {
            method: "POST",
            body: JSON.stringify({ newsletterId: genData.newsletter.id, userId: user.id }),
          });
        }
      }
    } catch (e) {
      // silently ignore
    }

    // 4. Send welcome email
    try {
      await authFetch("/api/welcome", {
        method: "POST",
        body: JSON.stringify({ email: user.email, name: user.user_metadata?.full_name || "" }),
      });
    } catch (e) {
      // silently ignore
    }

    setOnboardingSaving(false);
    setOnboardingComplete(true);
  }

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "vous";

  const lastOpenRate =
    lastNewsletter && lastNewsletter.recipient_count > 0
      ? Math.round((lastNewsletter.open_count / lastNewsletter.recipient_count) * 100)
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
    async function handleResendEmail() {
      if (!user?.email) return;
      setResendingEmail(true);
      try {
        await authFetch("/api/welcome", {
          method: "POST",
          body: JSON.stringify({ email: user.email, name: user.user_metadata?.full_name || "" }),
        });
      } catch {
        // silently fail
      }
      setResendingEmail(false);
    }

    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "rgba(245, 158, 11, 0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>
          {lang === "fr" ? "Vérifiez votre boîte mail" : "Check your inbox"}
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>
          {lang === "fr"
            ? "Un email de confirmation a été envoyé à :"
            : "A confirmation email has been sent to:"}
        </p>
        <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 24 }}>
          {user?.email}
        </p>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 32 }}>
          {lang === "fr"
            ? "Cliquez sur le lien dans l'email pour confirmer votre adresse et accéder à votre espace. Pensez à vérifier vos spams."
            : "Click the link in the email to confirm your address and access your dashboard. Check your spam folder."}
        </p>
        <button
          onClick={handleResendEmail}
          disabled={resendingEmail}
          style={{
            padding: "12px 28px",
            background: resendingEmail ? "var(--border)" : "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: resendingEmail ? "not-allowed" : "pointer",
          }}
        >
          {resendingEmail
            ? (lang === "fr" ? "Envoi en cours..." : "Sending...")
            : (lang === "fr" ? "Renvoyer l'email" : "Resend email")}
        </button>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 16 }}>
          {lang === "fr"
            ? "Vous ne trouvez pas l'email ? Vérifiez vos spams ou cliquez sur le bouton ci-dessus."
            : "Can't find the email? Check your spam or click the button above."}
        </p>
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
              {t("dashboard.onboarding_complete_desc")}
            </p>
          )}
          <button
            onClick={() => setIsNewUser(false)}
            style={{ padding: "12px 32px", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
          >
            {t("dashboard.onboarding_view_dashboard")}
          </button>
        </div>
      );
    }

    // Step 1 – Plan selection
    if (onboardingStep === 1) {
      const plans = [
        {
          key: "free",
          name: "Free",
          price: 0,
          annualPrice: 0,
          tagline: t("dashboard.plan_free_tagline"),
          features: [
            t("dashboard.plan_free_f1"),
            t("dashboard.plan_free_f2"),
            t("dashboard.plan_free_f3"),
            t("dashboard.plan_free_f4"),
          ],
          cta: t("dashboard.plan_free_cta"),
          free: true,
          popular: false,
          enterprise: false,
        },
        {
          key: "pro",
          name: "Pro",
          price: 19,
          annualPrice: 190,
          tagline: t("dashboard.plan_pro_tagline"),
          features: [
            t("dashboard.plan_pro_f1"),
            t("dashboard.plan_pro_f2"),
            t("dashboard.plan_pro_f3"),
            t("dashboard.plan_pro_f4"),
            t("dashboard.plan_pro_f5"),
          ],
          cta: t("dashboard.plan_pro_cta"),
          free: false,
          popular: true,
          enterprise: false,
        },
        {
          key: "business",
          name: "Business",
          price: 49,
          annualPrice: 490,
          tagline: t("dashboard.plan_biz_tagline"),
          features: [
            t("dashboard.plan_biz_f1"),
            t("dashboard.plan_biz_f2"),
            t("dashboard.plan_biz_f3"),
            t("dashboard.plan_biz_f4"),
            t("dashboard.plan_biz_f5"),
          ],
          cta: t("dashboard.plan_biz_cta"),
          free: false,
          popular: false,
          enterprise: false,
        },
        {
          key: "enterprise",
          name: "Enterprise",
          price: null,
          annualPrice: null,
          tagline: t("dashboard.plan_ent_tagline"),
          features: [
            t("dashboard.plan_ent_f1"),
            t("dashboard.plan_ent_f2"),
            t("dashboard.plan_ent_f3"),
            t("dashboard.plan_ent_f4"),
          ],
          cta: t("dashboard.plan_ent_cta"),
          free: false,
          popular: false,
          enterprise: true,
        },
      ];

      return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>1/5</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
              {t("dashboard.step1_title")}
            </h1>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {t("dashboard.step1_desc")}
            </p>
          </div>

          {/* Billing toggle */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <div style={{
              display: "inline-flex",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 4,
              gap: 4,
            }}>
              <button
                onClick={() => setBillingPeriod("monthly")}
                style={{
                  padding: "6px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: billingPeriod === "monthly" ? "var(--accent)" : "transparent",
                  color: billingPeriod === "monthly" ? "white" : "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {t("pricing.monthly")}
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                style={{
                  padding: "6px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: billingPeriod === "annual" ? "var(--accent)" : "transparent",
                  color: billingPeriod === "annual" ? "white" : "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {t("pricing.annual")}
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: billingPeriod === "annual" ? "rgba(255,255,255,0.25)" : "var(--success-bg)",
                  color: billingPeriod === "annual" ? "white" : "var(--success)",
                }}>
                  -20%
                </span>
              </button>
            </div>
          </div>

          {/* Plan cards */}
          <div
            className="onboarding-plan-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
            }}
          >
            {plans.map((plan) => {
              const displayPrice =
                billingPeriod === "annual" && plan.annualPrice !== null
                  ? plan.annualPrice
                  : plan.price;

              const isEnterprise = plan.enterprise;
              const isFree = plan.free || plan.price === 0;

              return (
                <div
                  key={plan.key}
                  style={{
                    position: "relative",
                    borderRadius: 12,
                    padding: "24px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    background: "var(--surface)",
                    border: plan.popular
                      ? "1.5px solid var(--accent)"
                      : "1px solid var(--border)",
                  }}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 12px",
                        borderRadius: 999,
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        background: "var(--accent)",
                        color: "white",
                        whiteSpace: "nowrap",
                      }}>
                        {t("pricing.popular")}
                      </span>
                    </div>
                  )}

                  {/* Plan name + tagline */}
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text)", marginBottom: 4, letterSpacing: "-0.01em" }}>
                      {plan.name}
                    </h3>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    {isEnterprise ? (
                      <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
                        {t("pricing.enterprise_price")}
                      </span>
                    ) : isFree ? (
                      <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text)", lineHeight: 1, letterSpacing: "-0.03em" }}>
                        {t("pricing.free_price")}
                      </span>
                    ) : (
                      <>
                        <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text)", lineHeight: 1, letterSpacing: "-0.03em" }}>
                          {typeof displayPrice === "number"
                            ? Number.isInteger(displayPrice)
                              ? displayPrice
                              : displayPrice.toFixed(1).replace(".", ",")
                            : displayPrice}€
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                            {billingPeriod === "annual" ? t("dashboard.per_year") : t("pricing.per_month")}
                          </span>
                          {billingPeriod === "annual" && (
                            <span style={{
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: "var(--success-bg)",
                              color: "var(--success)",
                            }}>
                              -20%
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Features */}
                  <ul style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, margin: 0, padding: 0, listStyle: "none" }}>
                    {plan.features.map((feature, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.8125rem" }}>
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2, color: plan.popular ? "var(--accent)" : "var(--success)" }}>
                          <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span style={{ color: "var(--text-secondary)" }}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Trial or promo note for paid plans */}
                  {!isFree && !isEnterprise && (
                    <p style={{ fontSize: 11, color: "var(--success)", fontWeight: 500, textAlign: "center", margin: 0 }}>
                      {t("dashboard.trial_note")}
                    </p>
                  )}

                  {/* CTA */}
                  {isEnterprise ? (
                    <a
                      href="/contact"
                      className="btn-ghost"
                      style={{ textAlign: "center", padding: "9px 16px", fontSize: "0.8125rem", justifyContent: "center", textDecoration: "none" }}
                    >
                      {plan.cta}
                    </a>
                  ) : isFree ? (
                    <button
                      onClick={() => setOnboardingStep(2)}
                      className="btn-ghost"
                      style={{ textAlign: "center", padding: "9px 16px", fontSize: "0.8125rem", justifyContent: "center", width: "100%", cursor: "pointer" }}
                    >
                      {plan.cta}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePlanCheckout(plan.key as "pro" | "business")}
                      disabled={checkoutLoading}
                      className={plan.popular ? "btn-primary" : "btn-ghost"}
                      style={{ textAlign: "center", padding: "9px 16px", fontSize: "0.8125rem", justifyContent: "center", width: "100%", cursor: checkoutLoading ? "wait" : "pointer", opacity: checkoutLoading ? 0.7 : 1 }}
                    >
                      {checkoutLoading ? t("common.loading") : plan.cta}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Responsive styles */}
          <style>{`
            @media (max-width: 800px) {
              .onboarding-plan-grid { grid-template-columns: 1fr 1fr !important; }
            }
            @media (max-width: 500px) {
              .onboarding-plan-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </div>
      );
    }

    // Step 2 – Brief
    if (onboardingStep === 2) {
      return (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>2/5</div>
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>3/5</div>
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>4/5</div>
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>5/5</div>
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
            {t("dashboard.step5_note")}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => setOnboardingStep(4)}
              style={{ padding: "12px 24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, color: "var(--text-secondary)", cursor: "pointer" }}
            >
              {t("dashboard.back")}
            </button>
            <button
              onClick={handleOnboardingComplete}
              disabled={onboardingSaving}
              style={{ padding: "12px 32px", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: onboardingSaving ? "not-allowed" : "pointer", opacity: onboardingSaving ? 0.7 : 1 }}
            >
              {onboardingSaving ? t("dashboard.generating") : t("dashboard.receive_first")}
            </button>
          </div>
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
      const now = new Date();
      const nextDate = new Date(nextNewsletter.date);
      const diffMs = nextDate.getTime() - now.getTime();
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
            <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              {loadingData ? "..." : (nextNewsletter?.date ?? "—")}
            </span>
            {!loadingData && nextNewsletter?.time && (
              <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{nextNewsletter.time}</span>
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
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
                {loadingData ? "..." : String(recipientCount ?? 0)}
              </span>
              <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{t("dashboard.metric_collaborators")}</span>
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
          <span style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)", letterSpacing: "-0.02em", display: "block", marginBottom: 4 }}>
            {loadingNewsletter ? "..." : lastOpenRate !== null ? `${lastOpenRate}%` : "—"}
          </span>
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
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{t("common.loading")}</p>
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
              {lastOpenRate !== null && (
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
              <Link href="/dashboard/generate" style={{ fontSize: 13, fontWeight: 500, color: "var(--accent)", textDecoration: "none" }}>
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
