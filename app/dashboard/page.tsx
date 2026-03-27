"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { getRecipients, getNewsletterConfig, upsertNewsletterConfig } from "@/lib/database";
import { supabase } from "@/lib/supabase";
import { DEFAULT_TOPICS } from "@/lib/topics";

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

const DAYS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const DAY_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function getNextDate(frequency: string, sendDay: string, sendHour: number): { date: string; time: string } {
  const now = new Date();
  const today = now.getDay();
  const timeStr = `${sendHour}h00`;

  if (frequency === "monthly") {
    const targetDate = sendDay === "1st" ? 1 : 15;
    const next = new Date(now.getFullYear(), now.getMonth(), targetDate);
    if (next <= now) next.setMonth(next.getMonth() + 1);
    return {
      date: `${next.getDate()} ${MONTHS_FR[next.getMonth()]} ${next.getFullYear()}`,
      time: timeStr,
    };
  }

  // weekly
  const targetDay = DAY_INDEX[sendDay] ?? 1;
  let diff = (targetDay - today + 7) % 7;
  if (diff === 0) diff = 7;
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  const day = DAYS_FR[next.getDay()];
  return {
    date: `${day.charAt(0).toUpperCase() + day.slice(1)} ${next.getDate()} ${MONTHS_FR[next.getMonth()]}`,
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
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
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [nextNewsletter, setNextNewsletter] = useState<{ date: string; time: string } | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [lastNewsletter, setLastNewsletter] = useState<Newsletter | null>(null);
  const [loadingNewsletter, setLoadingNewsletter] = useState(true);

  // Onboarding state
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null); // null = loading
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [brief, setBrief] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number>(8);
  const [onboardingSaving, setOnboardingSaving] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Check if new user (no topics configured)
  useEffect(() => {
    if (!user) return;
    supabase
      .from("newsletter_config")
      .select("topics, custom_brief")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data && data.topics && data.topics.length > 0) {
          setIsNewUser(false);
        } else {
          setIsNewUser(true);
        }
      });
  }, [user]);

  useEffect(() => {
    if (!user || isNewUser !== false) return;

    async function loadData() {
      const [recipientsResult, configResult] = await Promise.all([
        getRecipients(user!.id),
        getNewsletterConfig(user!.id),
      ]);

      setRecipientCount(recipientsResult.data.length);

      const freq = configResult.data?.frequency ?? "weekly";
      const day = configResult.data?.send_day ?? "monday";
      const hour = configResult.data?.send_hour ?? 9;
      setNextNewsletter(getNextDate(freq, day, hour));

      setLoadingData(false);
    }

    loadData();
  }, [user, isNewUser]);

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

  async function handleOnboardingComplete() {
    if (!user) return;
    setOnboardingSaving(true);

    // 1. Save config
    const topicsArray = DEFAULT_TOPICS.map((t) => ({
      id: t.id,
      label: t.label,
      enabled: selectedTopics.includes(t.id),
    }));

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
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const genData = await genRes.json();

      if (genData.newsletter) {
        await fetch("/api/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newsletterId: genData.newsletter.id }),
        });
      }
    } catch (e) {
      console.error("First newsletter failed:", e);
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

  const metrics = [
    {
      icon: <IconCalendar />,
      value: loadingData ? "..." : (nextNewsletter?.date ?? "—"),
      sublabel: loadingData ? "" : (nextNewsletter?.time ?? ""),
      label: "Prochaine newsletter",
    },
    {
      icon: <IconUsers />,
      value: loadingData ? "..." : String(recipientCount ?? 0),
      sublabel: "collaborateurs",
      label: "Destinataires",
    },
    {
      icon: <IconEye />,
      value: loadingNewsletter ? "..." : lastOpenRate !== null ? `${lastOpenRate}%` : "—",
      sublabel: "",
      label: "Taux d'ouverture (dernière)",
    },
    {
      icon: <IconDocument />,
      value: loadingNewsletter ? "..." : lastArticleCount !== null ? String(lastArticleCount) : "—",
      sublabel: lastArticleCount !== null ? "articles" : "",
      label: "Articles (dernière newsletter)",
    },
  ];

  // Loading state while checking if new user
  if (isNewUser === null) {
    return (
      <div style={{ padding: "32px", maxWidth: 900 }}>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Chargement…</p>
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
            C&apos;est tout bon !
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
            Votre première newsletter a été envoyée. Vérifiez votre boîte mail.<br/>
            Les prochaines arriveront automatiquement le 1er et le 15 de chaque mois.
          </p>
          <button
            onClick={() => setIsNewUser(false)}
            style={{ padding: "12px 32px", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
          >
            Voir mon tableau de bord
          </button>
        </div>
      );
    }

    // Step 1 – Brief
    if (onboardingStep === 1) {
      return (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>1/4</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
            Décrivez votre activité
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
            Décrivez votre entreprise, vos concurrents, vos clients et les sujets qui vous intéressent. Plus c&apos;est détaillé, plus chaque newsletter vous apprendra quelque chose de nouveau.
          </p>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder={`Ex : Nous sommes un cabinet de recrutement spécialisé IT en Île-de-France. Concurrents : Hays, Michael Page, Robert Half. Clients : PME et ETI du secteur tech.\nJe veux suivre : marché de l'emploi tech en France, nouvelles réglementations RH et droit du travail, levées de fonds des startups qui recrutent, tendances télétravail et salaires, IA appliquée au recrutement.`}
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
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, textAlign: "left", lineHeight: 1.6 }}>
            <p style={{ marginBottom: 6, fontWeight: 600, color: "var(--text-secondary)" }}>Plus votre brief est détaillé, plus votre newsletter sera riche et variée :</p>
            <p style={{ margin: 0 }}>Mentionnez vos concurrents par nom, vos clients importants, les réglementations qui vous concernent, les innovations qui vous intéressent, les marchés géographiques que vous suivez, les salons ou événements de votre secteur.</p>
          </div>
          <button
            onClick={() => setOnboardingStep(2)}
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
            Continuer
          </button>
        </div>
      );
    }

    // Step 2 – Topics
    if (onboardingStep === 2) {
      return (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>2/4</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
            Choisissez vos thématiques
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 24 }}>
            Sélectionnez les sujets qui vous intéressent. Vous pourrez les modifier à tout moment.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 24 }}>
            {DEFAULT_TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => toggleTopic(topic.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: selectedTopics.includes(topic.id) ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: selectedTopics.includes(topic.id) ? "rgba(37,99,235,0.08)" : "var(--surface)",
                  color: selectedTopics.includes(topic.id) ? "var(--accent)" : "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {topic.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => setOnboardingStep(1)}
              style={{ padding: "12px 24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, color: "var(--text-secondary)", cursor: "pointer" }}
            >
              Retour
            </button>
            <button
              onClick={() => setOnboardingStep(3)}
              disabled={selectedTopics.length === 0}
              style={{ padding: "12px 32px", background: selectedTopics.length > 0 ? "var(--accent)" : "var(--border)", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: selectedTopics.length > 0 ? "pointer" : "not-allowed" }}
            >
              Continuer
            </button>
          </div>
        </div>
      );
    }

    // Step 3 – Recipient email
    if (onboardingStep === 3) {
      return (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>3/4</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
            Où envoyer votre newsletter ?
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 24 }}>
            Votre email est déjà ajouté. Vous recevrez votre première newsletter dans quelques instants.
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
            Vous pourrez ajouter d&apos;autres destinataires plus tard depuis votre tableau de bord.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
            <button
              onClick={() => setOnboardingStep(2)}
              style={{ padding: "12px 24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, color: "var(--text-secondary)", cursor: "pointer" }}
            >
              Retour
            </button>
            <button
              onClick={() => setOnboardingStep(4)}
              style={{ padding: "12px 32px", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
            >
              Continuer
            </button>
          </div>
        </div>
      );
    }

    // Step 4 – Send slot + launch
    if (onboardingStep === 4) {
      return (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>4/4</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
            Quand voulez-vous recevoir votre newsletter ?
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 24 }}>
            Choisissez un créneau. Vous pourrez le modifier à tout moment.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
            {[
              { label: "Matin (8h)", value: 8 },
              { label: "Midi (12h)", value: 12 },
              { label: "Soir (18h)", value: 18 },
            ].map((slot) => (
              <button
                key={slot.value}
                onClick={() => setSelectedSlot(slot.value)}
                style={{
                  padding: "16px 24px",
                  borderRadius: 10,
                  border: selectedSlot === slot.value ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: selectedSlot === slot.value ? "rgba(37,99,235,0.08)" : "var(--surface)",
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
            Vos newsletters seront envoyées le 1er et le 15 de chaque mois à l&apos;heure choisie.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => setOnboardingStep(3)}
              style={{ padding: "12px 24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, color: "var(--text-secondary)", cursor: "pointer" }}
            >
              Retour
            </button>
            <button
              onClick={handleOnboardingComplete}
              disabled={onboardingSaving}
              style={{ padding: "12px 32px", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: onboardingSaving ? "not-allowed" : "pointer", opacity: onboardingSaving ? 0.7 : 1 }}
            >
              {onboardingSaving ? "Génération en cours…" : "Recevoir ma première newsletter"}
            </button>
          </div>
        </div>
      );
    }
  }

  // ── NORMAL DASHBOARD ─────────────────────────────────────────────
  return (
    <div style={{ padding: "32px", maxWidth: 900 }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "var(--text)",
            letterSpacing: "-0.02em",
            marginBottom: 6,
          }}
        >
          Bonjour, {firstName}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Voici un résumé de votre activité
        </p>
      </div>

      {/* Metric cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
        className="dashboard-metrics-grid"
      >
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div style={{ color: "var(--text-muted)", marginBottom: 12, display: "flex" }}>
              {m.icon}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
                {m.value}
              </span>
              {m.sublabel && (
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{m.sublabel}</span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Last newsletter */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 16,
          }}
        >
          Dernière newsletter
        </h2>
        {loadingNewsletter ? (
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Chargement…</p>
        ) : lastNewsletter === null ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
              Aucune newsletter envoyée
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
              Configurez vos thématiques et générez votre première newsletter.
            </p>
            <Link href="/dashboard/generate" className="btn-primary" style={{ padding: "10px 20px", fontSize: 14 }}>
              Générer ma première newsletter →
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                  {lastNewsletter.status === "sent" ? "Date d'envoi" : "Générée le"}
                </span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>
                  {lastNewsletter.sent_at
                    ? formatDate(lastNewsletter.sent_at)
                    : lastNewsletter.generated_at
                    ? formatDate(lastNewsletter.generated_at)
                    : "—"}
                </span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Sujet</span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>
                  {lastNewsletter.subject || "—"}
                </span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Statut</span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>
                  {lastNewsletter.status === "sent" ? "Envoyée" : "Brouillon"}
                </span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Taux d&apos;ouverture</span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>
                  {lastOpenRate !== null ? `${lastOpenRate}%` : "—"}
                </span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Nombre de clics</span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>
                  {lastNewsletter.click_count ?? "—"}
                </span>
              </div>
            </div>
            <Link href="/dashboard/generate" className="btn-ghost" style={{ fontSize: 13, padding: "6px 14px" }}>
              Générer une nouvelle →
            </Link>
          </>
        )}
      </div>

      {/* Quick actions */}
      <h2
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 12,
        }}
      >
        Actions rapides
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="dashboard-actions-grid">
        <Link
          href="/dashboard/generate"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--accent)",
            border: "1px solid var(--accent)",
            borderRadius: 12,
            padding: "16px 20px",
            textDecoration: "none",
            gridColumn: "1 / -1",
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "0.88";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>
            Générer ma newsletter →
          </span>
        </Link>
        <Link
          href="/dashboard/config"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
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
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
            Configurer ma newsletter
          </span>
          <span style={{ color: "var(--text-muted)" }}>
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
            borderRadius: 12,
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
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
            Voir les analytics
          </span>
          <span style={{ color: "var(--text-muted)" }}>
            <IconArrow />
          </span>
        </Link>
      </div>

      <style>{`
        @media (max-width: 600px) {
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
