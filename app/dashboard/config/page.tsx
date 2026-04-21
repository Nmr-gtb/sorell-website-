"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import {
  getNewsletterConfig,
  upsertNewsletterConfig,
  getRecipients,
  addRecipient,
  deleteRecipient,
  getProfile,
} from "@/lib/database";
import { supabase } from "@/lib/supabase";
import { getPlanLimits } from "@/lib/plans";
import { useLanguage } from "@/lib/LanguageContext";
import { DEFAULT_TOPICS } from "@/lib/topics";
import { authFetch } from "@/lib/api";
import { openSolyBrief } from "@/components/ChatWidget";
import CrownBadge from "@/components/CrownBadge";
import NewsletterLoader from "@/components/NewsletterLoader";

const ALL_SOURCES = [
  "Les Echos", "Le Monde", "Le Figaro", "BFM Business", "La Tribune",
  "Challenges", "Financial Times", "Bloomberg", "Reuters", "The Economist",
  "Harvard Business Review", "TechCrunch", "The Verge", "Wired",
  "MIT Technology Review", "L'Usine Digitale", "Maddyness", "FrenchWeb",
  "Capital", "Investir", "McKinsey Insights", "Gartner", "Forrester",
  "The Lancet", "Nature", "INSERM", "Medscape", "L'Usine Nouvelle",
  "LSA Commerce", "Stratégies", "CB News", "Mind Media",
];

const PRESET_COLORS = [
  { label: "Teal Sorell", value: "#005058" },
  { label: "Bleu foncé", value: "#1E40AF" },
  { label: "Vert", value: "#059669" },
  { label: "Violet", value: "#7C3AED" },
  { label: "Rouge", value: "#DC2626" },
  { label: "Orange", value: "#EA580C" },
  { label: "Rose", value: "#DB2777" },
  { label: "Noir", value: "#111827" },
];

const defaultTopics = DEFAULT_TOPICS;
const defaultSources = ["Les Echos", "TechCrunch", "McKinsey Insights"];

type Recipient = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* ─── Tab icon components ─── */
function IconFileText() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconPalette() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="10.5" r="2.5" />
      <circle cx="8.5" cy="7.5" r="2.5" />
      <circle cx="6.5" cy="12" r="2.5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#D97706" stroke="#D97706" strokeWidth="1.5">
      <path d="M2 20h20L19 9l-5 4-2-6-2 6-5-4z" />
    </svg>
  );
}

type TabId = "contenu" | "sources" | "envoi" | "apparence";

export default function ConfigPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabId>("contenu");

  // Content state
  const [topics, setTopics] = useState(defaultTopics);
  const [customBrief, setCustomBrief] = useState("");
  const [newTopicLabel, setNewTopicLabel] = useState("");
  const [showAddTopic, setShowAddTopic] = useState(false);

  // Sources state
  const [sources, setSources] = useState(defaultSources);
  const [newSource, setNewSource] = useState("");

  // Scheduling state
  const [frequency, setFrequency] = useState("weekly");
  const [sendDay, setSendDay] = useState("monday");
  const [sendDay2, setSendDay2] = useState("thursday");
  const [sendHour, setSendHour] = useState(9);

  // Recipients state
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("");
  const [addingRecipient, setAddingRecipient] = useState(false);
  const [recipientLimitMsg, setRecipientLimitMsg] = useState("");

  // Customization state
  const [brandColor, setBrandColor] = useState("#005058");
  const [textColor, setTextColor] = useState("#111827");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [bodyTextColor, setBodyTextColor] = useState("#4B5563");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Global state
  const [realPlan, setRealPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [instantSending, setInstantSending] = useState(false);
  const [instantSent, setInstantSent] = useState(false);
  const [instantError, setInstantError] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      setLoading(true);
      const [configResult, recipientsResult, profileResult] = await Promise.all([
        getNewsletterConfig(user!.id),
        getRecipients(user!.id),
        getProfile(user!.id),
      ]);

      if (profileResult.data?.plan) {
        setRealPlan(profileResult.data.plan);
      }

      if (configResult.data) {
        const cfg = configResult.data;
        if (cfg.topics && cfg.topics.length > 0) setTopics(cfg.topics);
        if (cfg.sources && cfg.sources.length > 0) setSources(cfg.sources);
        if (cfg.frequency) setFrequency(cfg.frequency);
        if (cfg.send_day) {
          if (cfg.frequency === "biweekly" && cfg.send_day.includes(",")) {
            const parts = cfg.send_day.split(",");
            setSendDay(parts[0].trim());
            setSendDay2(parts[1].trim());
          } else {
            setSendDay(cfg.send_day);
          }
        }
        if (cfg.send_hour !== undefined && cfg.send_hour !== null) setSendHour(cfg.send_hour);
        if (cfg.custom_brief) setCustomBrief(cfg.custom_brief);
        if (cfg.brand_color) setBrandColor(cfg.brand_color);
        if (cfg.custom_logo_url) setLogoUrl(cfg.custom_logo_url);
        if (cfg.text_color) setTextColor(cfg.text_color);
        if (cfg.bg_color) setBgColor(cfg.bg_color);
        if (cfg.body_text_color) setBodyTextColor(cfg.body_text_color);
      }

      let loadedRecipients = recipientsResult.data ?? [];
      if (loadedRecipients.length === 0 && user?.email) {
        await supabase.from("recipients").upsert(
          { user_id: user.id, email: user.email, name: user.user_metadata?.full_name || "", role: "" },
          { onConflict: "user_id,email" }
        );
        const { data: refreshed } = await supabase.from("recipients").select("*").eq("user_id", user.id);
        loadedRecipients = refreshed ?? [];
      }
      setRecipients(loadedRecipients);
      setLoading(false);
    }

    loadData();
  }, [user]);

  const plan = realPlan;
  const limits = getPlanLimits(plan);
  const isPro = plan === "pro" || plan === "business" || plan === "enterprise";
  const canUseLogo = plan === "business" || plan === "enterprise";

  /* ─── Topic handlers ─── */
  const toggleTopic = (id: string) => {
    setTopics((prev) => prev.map((tp) => (tp.id === id ? { ...tp, enabled: !tp.enabled } : tp)));
  };
  const addCustomTopic = () => {
    const trimmed = newTopicLabel.trim();
    if (!trimmed) return;
    setTopics((prev) => [...prev, { id: `custom-${Date.now()}`, label: trimmed, enabled: true }]);
    setNewTopicLabel("");
    setShowAddTopic(false);
  };
  const removeTopic = (id: string) => setTopics((prev) => prev.filter((tp) => tp.id !== id));

  /* ─── Source handlers ─── */
  const addSource = () => {
    const trimmed = newSource.trim();
    if (trimmed && !sources.includes(trimmed)) {
      setSources((prev) => [...prev, trimmed]);
      setNewSource("");
    }
  };
  const removeSource = (s: string) => setSources((prev) => prev.filter((x) => x !== s));

  /* ─── Logo handlers ─── */
  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "image/png" || file.type === "image/svg+xml" || file.type === "image/jpeg")) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "image/png" || file.type === "image/svg+xml" || file.type === "image/jpeg")) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };
  const uploadLogo = async () => {
    if (!logoFile || !user) return null;
    setUploading(true);
    const fileExt = logoFile.name.split(".").pop();
    const filePath = `${user.id}/logo.${fileExt}`;
    await supabase.storage.from("logos").remove([`${user.id}/logo.png`, `${user.id}/logo.svg`, `${user.id}/logo.jpg`, `${user.id}/logo.jpeg`]);
    const { error } = await supabase.storage.from("logos").upload(filePath, logoFile, { upsert: true });
    setUploading(false);
    if (error) return null;
    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  /* ─── Save handler ─── */
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError("");

    let savedFrequency = frequency;
    let savedSendDay = sendDay;
    const savedSendHour = sendHour;

    if (plan === "free") {
      savedFrequency = "monthly";
      savedSendDay = "1st";
    } else if (frequency === "monthly") {
      savedSendDay = "1st";
    } else if (frequency === "biweekly") {
      savedSendDay = `${sendDay},${sendDay2}`;
    }

    // Upload logo if needed
    let finalLogoUrl = logoUrl;
    if (logoFile && canUseLogo) {
      const uploadedUrl = await uploadLogo();
      if (uploadedUrl) {
        finalLogoUrl = uploadedUrl;
        setLogoUrl(uploadedUrl);
        setLogoFile(null);
      }
    }

    const updateData: Record<string, unknown> = {
      topics,
      sources,
      frequency: savedFrequency,
      custom_brief: customBrief,
      send_day: savedSendDay,
      send_hour: savedSendHour,
    };

    if (isPro) {
      updateData.brand_color = brandColor;
      updateData.text_color = textColor;
      updateData.bg_color = bgColor;
      updateData.body_text_color = bodyTextColor;
      updateData.custom_logo_url = finalLogoUrl || null;
    }

    const { error } = await upsertNewsletterConfig(user.id, updateData);
    setSaving(false);

    if (error) {
      setSaveError(t("config.save_error"));
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);

      // Fire-and-forget activity tracking
      authFetch("/api/activity", {
        method: "POST",
        body: JSON.stringify({ type: "changement_config", field: activeTab, details: `Onglet ${activeTab} sauvegarde` }),
      }).catch(() => {});

      // Instant newsletter on first configuration
      const { count } = await supabase
        .from("newsletters")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (count === 0) {
        setInstantSending(true);
        setInstantError("");
        try {
          const enabledTopics = topics.filter((tp) => tp.enabled);
          const genRes = await authFetch("/api/generate", {
            method: "POST",
            body: JSON.stringify({ userId: user.id, topics: enabledTopics, sources, customBrief }),
          });
          if (genRes.status === 429) {
            setInstantError(t("config.rate_limit_error"));
          } else {
            const genData = await genRes.json();
            if (genData.newsletter) {
              await authFetch("/api/send", {
                method: "POST",
                body: JSON.stringify({ newsletterId: genData.newsletter.id, userId: user.id }),
              });
              setInstantSent(true);
            }
          }
        } catch {
          setInstantError(t("config.instant_error"));
        }
        setInstantSending(false);
      }
    }
  };

  /* ─── Recipient handlers ─── */
  const handleAddRecipient = async () => {
    if (!user || !newName.trim() || !newEmail.trim()) return;
    const maxR = limits.maxRecipients;
    if (maxR !== -1 && recipients.length >= maxR) {
      setRecipientLimitMsg(
        plan === "free"
          ? t("config.recipient_limit_free").replace("{max}", String(maxR))
          : plan === "pro"
          ? t("config.recipient_limit_pro").replace("{max}", String(maxR))
          : t("config.recipient_limit_upgrade").replace("{max}", String(maxR))
      );
      return;
    }
    setAddingRecipient(true);
    const { data, error } = await addRecipient(user.id, {
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole.trim(),
    });
    setAddingRecipient(false);
    if (!error && data) {
      setRecipients((prev) => [...prev, data]);
      setNewName("");
      setNewEmail("");
      setNewRole("");
      setRecipientLimitMsg("");

      // Fire-and-forget activity tracking
      authFetch("/api/activity", {
        method: "POST",
        body: JSON.stringify({ type: "ajout_destinataire", field: "recipients", recipientEmail: data.email }),
      }).catch(() => {});
    }
  };

  const handleDeleteRecipient = async (id: string) => {
    const deletedRecipient = recipients.find((r) => r.id === id);
    const { error } = await deleteRecipient(id);
    if (!error) {
      setRecipients((prev) => prev.filter((r) => r.id !== id));
      setRecipientLimitMsg("");

      // Fire-and-forget activity tracking
      authFetch("/api/activity", {
        method: "POST",
        body: JSON.stringify({ type: "suppression_destinataire", field: "recipients", recipientEmail: deletedRecipient?.email ?? id }),
      }).catch(() => {});
    }
  };

  const maxR = limits.maxRecipients;
  const recipientsLabel = maxR === -1
    ? `${recipients.length} ${t("config.recipient_count")}`
    : `${recipients.length} / ${maxR} ${t("config.recipient_count")}`;

  /* ─── Tab config ─── */
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "contenu", label: t("config.tab_contenu"), icon: <IconFileText /> },
    { id: "sources", label: t("config.tab_sources"), icon: <IconGlobe /> },
    { id: "envoi", label: t("config.tab_envoi"), icon: <IconSend /> },
    { id: "apparence", label: t("config.tab_apparence"), icon: <IconPalette /> },
  ];

  /* ─── Schedule confirmation text ─── */
  const getScheduleConfirmation = () => {
    const dayKey = `config.${sendDay}` as const;
    const dayKey2 = `config.${sendDay2}` as const;
    const dayLabel = t(dayKey) || sendDay;
    const dayLabel2 = t(dayKey2) || sendDay2;
    const timeStr = `${Math.floor(sendHour)}h${sendHour % 1 === 0.5 ? "30" : "00"}`;
    if (plan === "free") return t("config.confirm_free").replace("{hour}", `${sendHour}h00`);
    if (frequency === "monthly") return t("config.confirm_free").replace("{hour}", `${sendHour}h00`);
    if (frequency === "daily") return t("config.confirm_daily").replace("{hour}", timeStr);
    if (frequency === "biweekly") return t("config.confirm_biweekly").replace("{day1}", dayLabel).replace("{day2}", dayLabel2).replace("{hour}", timeStr);
    return t("config.confirm_weekly").replace("{day}", dayLabel).replace("{hour}", timeStr);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0]?.[0]?.toUpperCase() || "?";
  };

  const avatarColors = ["#005058", "#0D9488", "#7C3AED", "#DC2626", "#EA580C", "#059669", "#1E40AF", "#DB2777"];

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900 }} className="config-page-container">
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 6 }}>
          {t("config.title")}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          {t("config.subtitle_tabs")}
        </p>
      </div>

      {/* Tab bar */}
      <div
        className="config-tab-bar"
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          marginBottom: 28,
          gap: 0,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 20px",
                background: "transparent",
                border: "none",
                borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? "var(--accent)" : "var(--text-muted)",
                transition: "color 0.15s ease, border-color 0.15s ease",
              }}
            >
              <span style={{ display: "flex", opacity: isActive ? 1 : 0.6 }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ fontSize: 14, color: "var(--text-muted)", padding: "24px 0" }}>
          {t("common.loading")}
        </div>
      ) : (
        <>
          {/* ═══════ TAB: CONTENU ═══════ */}
          {activeTab === "contenu" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Brief section */}
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 24,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                    {t("config.custom_brief")}
                  </h2>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {customBrief.length} / 1000
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
                  {t("config.custom_brief_desc")}
                </p>
                <textarea
                  className="input-field"
                  value={customBrief}
                  onChange={(e) => setCustomBrief(e.target.value.slice(0, 1000))}
                  placeholder={t("config.custom_brief_placeholder")}
                  style={{ width: "100%", minHeight: 140, resize: "vertical", boxSizing: "border-box" }}
                />
                <button
                  onClick={() => openSolyBrief((brief) => setCustomBrief(brief))}
                  style={{
                    marginTop: 12,
                    padding: "9px 16px",
                    borderRadius: 8,
                    border: "1px solid var(--accent-border, var(--border))",
                    background: "var(--accent-subtle, #f0fdfa)",
                    color: "var(--accent, #005058)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "background 0.15s",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {t("config.brief_ai_help") !== "config.brief_ai_help" ? t("config.brief_ai_help") : "Soly m'aide a rediger mon brief"}
                </button>
              </div>

              {/* Topics section */}
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 24,
              }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 6px" }}>
                  {t("config.topics")}
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
                  {t("config.topics_desc")}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => toggleTopic(topic.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 14px",
                        borderRadius: 99,
                        border: topic.enabled ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                        background: topic.enabled ? "rgba(0,80,88,0.06)" : "var(--surface)",
                        color: topic.enabled ? "var(--accent)" : "var(--text-secondary)",
                        fontSize: 13,
                        fontWeight: topic.enabled ? 500 : 400,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {topic.enabled && <IconCheck />}
                      {topic.label}
                      {topic.id.startsWith("custom-") && (
                        <span
                          onClick={(e) => { e.stopPropagation(); removeTopic(topic.id); }}
                          style={{ display: "flex", marginLeft: 2, opacity: 0.5 }}
                        >
                          <IconX />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {limits.customTopics ? (
                  showAddTopic ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        className="input-field"
                        value={newTopicLabel}
                        onChange={(e) => setNewTopicLabel(e.target.value)}
                        placeholder={t("config.topic_placeholder")}
                        onKeyDown={(e) => e.key === "Enter" && addCustomTopic()}
                        autoFocus
                        style={{ flex: 1 }}
                      />
                      <button
                        onClick={addCustomTopic}
                        disabled={!newTopicLabel.trim()}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: "none",
                          background: "var(--accent)",
                          color: "white",
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: newTopicLabel.trim() ? "pointer" : "not-allowed",
                          opacity: newTopicLabel.trim() ? 1 : 0.5,
                        }}
                      >
                        <IconPlus />
                        {t("common.add")}
                      </button>
                      <button
                        onClick={() => { setShowAddTopic(false); setNewTopicLabel(""); }}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          background: "transparent",
                          color: "var(--text-secondary)",
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        {t("common.cancel")}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddTopic(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "1px dashed var(--border)",
                        background: "transparent",
                        color: "var(--text-muted)",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      <IconPlus />
                      {t("config.add_topic")}
                    </button>
                  )
                ) : (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 16px",
                    borderRadius: 8,
                    background: "var(--surface-alt, #f9fafb)",
                    border: "1px solid var(--border)",
                  }}>
                    <CrownBadge tooltip={t("config.custom_topics_locked")} />
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {t("config.custom_topics_locked")}{" "}
                      <a href="/tarifs" style={{ color: "var(--accent)", textDecoration: "underline" }}>{t("dash.upgrade_btn")}</a>
                    </span>
                  </div>
                )}
              </div>

              {/* Save button */}
              {renderSaveButton()}
            </div>
          )}

          {/* ═══════ TAB: SOURCES ═══════ */}
          {activeTab === "sources" && !limits.customSources && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 48,
                textAlign: "center",
              }}>
                <div style={{ marginBottom: 16 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>
                  {t("config.custom_sources_locked")}
                </div>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 420, margin: "0 auto 24px" }}>
                  {t("config.verified_sources_desc")}
                </p>
                <button
                  onClick={() => window.location.href = "/tarifs"}
                  style={{
                    display: "inline-block",
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 500,
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {t("dash.upgrade_btn")}
                </button>
              </div>
            </div>
          )}
          {activeTab === "sources" && limits.customSources && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Verified sources grid */}
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 24,
              }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 6px" }}>
                  {t("config.verified_sources")}
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
                  {t("config.verified_sources_desc")}
                </p>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 8,
                }}>
                  {ALL_SOURCES.map((source) => {
                    const isSelected = sources.includes(source);
                    return (
                      <button
                        key={source}
                        onClick={() => {
                          if (isSelected) setSources(sources.filter((s) => s !== source));
                          else setSources([...sources, source]);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: isSelected ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                          background: isSelected ? "rgba(0,80,88,0.04)" : "var(--surface)",
                          cursor: "pointer",
                          fontSize: 13,
                          color: isSelected ? "var(--accent)" : "var(--text)",
                          fontWeight: isSelected ? 500 : 400,
                          textAlign: "left",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span>{source}</span>
                        {isSelected && (
                          <span style={{ color: "var(--accent)", display: "flex" }}>
                            <IconCheck />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom source */}
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 24,
              }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: "0 0 6px" }}>
                  {t("config.custom_source")}
                </h2>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
                  <input
                    className="input-field"
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    placeholder={t("config.add_source_placeholder")}
                    onKeyDown={(e) => e.key === "Enter" && addSource()}
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={addSource}
                    disabled={!newSource.trim()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: "var(--accent)",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: newSource.trim() ? "pointer" : "not-allowed",
                      opacity: newSource.trim() ? 1 : 0.5,
                      flexShrink: 0,
                    }}
                  >
                    <IconPlus />
                    {t("common.add")}
                  </button>
                </div>
                {/* Show custom sources (not in ALL_SOURCES) */}
                {sources.filter((s) => !ALL_SOURCES.includes(s)).length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    {sources.filter((s) => !ALL_SOURCES.includes(s)).map((s) => (
                      <div
                        key={s}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: "var(--surface-alt)",
                          border: "1px solid var(--border)",
                          fontSize: 13,
                          color: "var(--text)",
                        }}
                      >
                        {s}
                        <button
                          onClick={() => removeSource(s)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            display: "flex",
                            padding: 0,
                          }}
                        >
                          <IconX />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {renderSaveButton()}
            </div>
          )}

          {/* ═══════ TAB: ENVOI ═══════ */}
          {activeTab === "envoi" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Schedule section */}
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 24,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ display: "flex", color: "var(--accent)" }}><IconClock /></span>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                    {t("config.scheduling")}
                  </h2>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
                  {t("config.scheduling_desc")}
                </p>

                {plan === "free" ? (
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 200px" }}>
                      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{t("config.frequency")}</label>
                      <div style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--surface-alt)",
                        fontSize: 14,
                        color: "var(--text-muted)",
                      }}>
                        {t("config.free_schedule_desc")}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 150px" }}>
                      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{t("config.hour")}</label>
                      <select
                        className="select-field"
                        value={sendHour}
                        onChange={(e) => setSendHour(Number(e.target.value))}
                        style={{ height: 42 }}
                      >
                        <option value={8}>{t("config.morning")}</option>
                        <option value={12}>{t("config.noon")}</option>
                        <option value={18}>{t("config.evening")}</option>
                      </select>
                    </div>
                  </div>
                ) : plan === "pro" ? (
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 160px" }}>
                      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{t("config.frequency")}</label>
                      <select
                        className="select-field"
                        value={frequency}
                        onChange={(e) => {
                          setFrequency(e.target.value);
                          if (e.target.value === "weekly" || e.target.value === "biweekly") setSendDay("monday");
                        }}
                        style={{ height: 42 }}
                      >
                        <option value="weekly">{t("config.freq_weekly")}</option>
                        <option value="biweekly">{t("config.freq_biweekly")}</option>
                        <option value="monthly">{t("config.freq_monthly")}</option>
                      </select>
                    </div>
                    {(frequency === "weekly" || frequency === "biweekly") && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 140px" }}>
                        <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                          {frequency === "biweekly" ? t("config.first_day") : t("config.day")}
                        </label>
                        <select className="select-field" value={sendDay} onChange={(e) => setSendDay(e.target.value)} style={{ height: 42 }}>
                          <option value="monday">{t("config.monday")}</option>
                          <option value="tuesday">{t("config.tuesday")}</option>
                          <option value="wednesday">{t("config.wednesday")}</option>
                          <option value="thursday">{t("config.thursday")}</option>
                          <option value="friday">{t("config.friday")}</option>
                          <option value="saturday">{t("config.saturday")}</option>
                          <option value="sunday">{t("config.sunday")}</option>
                        </select>
                      </div>
                    )}
                    {frequency === "biweekly" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 140px" }}>
                        <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{t("config.second_day")}</label>
                        <select className="select-field" value={sendDay2} onChange={(e) => setSendDay2(e.target.value)} style={{ height: 42 }}>
                          <option value="monday">{t("config.monday")}</option>
                          <option value="tuesday">{t("config.tuesday")}</option>
                          <option value="wednesday">{t("config.wednesday")}</option>
                          <option value="thursday">{t("config.thursday")}</option>
                          <option value="friday">{t("config.friday")}</option>
                        </select>
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 150px" }}>
                      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{t("config.hour")}</label>
                      <select className="select-field" value={sendHour} onChange={(e) => setSendHour(Number(e.target.value))} style={{ height: 42 }}>
                        {Array.from({ length: 15 }, (_, i) => i + 6).map((h) => (
                          <option key={h} value={h}>{h}h00</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 160px" }}>
                      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{t("config.frequency")}</label>
                      <select
                        className="select-field"
                        value={frequency}
                        onChange={(e) => {
                          setFrequency(e.target.value);
                          if (e.target.value === "weekly" || e.target.value === "biweekly") setSendDay("monday");
                        }}
                        style={{ height: 42 }}
                      >
                        <option value="weekly">{t("config.freq_weekly")}</option>
                        <option value="biweekly">{t("config.freq_biweekly")}</option>
                        <option value="daily">{t("config.freq_daily")}</option>
                      </select>
                    </div>
                    {(frequency === "weekly" || frequency === "biweekly") && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 140px" }}>
                        <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                          {frequency === "biweekly" ? t("config.first_day") : t("config.day")}
                        </label>
                        <select className="select-field" value={sendDay} onChange={(e) => setSendDay(e.target.value)} style={{ height: 42 }}>
                          <option value="monday">{t("config.monday")}</option>
                          <option value="tuesday">{t("config.tuesday")}</option>
                          <option value="wednesday">{t("config.wednesday")}</option>
                          <option value="thursday">{t("config.thursday")}</option>
                          <option value="friday">{t("config.friday")}</option>
                        </select>
                      </div>
                    )}
                    {frequency === "biweekly" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 140px" }}>
                        <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{t("config.second_day")}</label>
                        <select className="select-field" value={sendDay2} onChange={(e) => setSendDay2(e.target.value)} style={{ height: 42 }}>
                          <option value="monday">{t("config.monday")}</option>
                          <option value="tuesday">{t("config.tuesday")}</option>
                          <option value="wednesday">{t("config.wednesday")}</option>
                          <option value="thursday">{t("config.thursday")}</option>
                          <option value="friday">{t("config.friday")}</option>
                        </select>
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 120px" }}>
                      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{t("config.hour")}</label>
                      <select className="select-field" value={sendHour} onChange={(e) => setSendHour(Number(e.target.value))} style={{ height: 42 }}>
                        {Array.from({ length: 29 }, (_, i) => 6 + i * 0.5).map((h) => (
                          <option key={h} value={h}>{Math.floor(h)}h{h % 1 === 0.5 ? "30" : "00"}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Confirmation banner */}
                <div style={{
                  marginTop: 16,
                  padding: "12px 16px",
                  background: "rgba(16,185,129,0.06)",
                  border: "1px solid rgba(16,185,129,0.15)",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#059669",
                  lineHeight: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <span style={{ display: "flex", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </span>
                  {getScheduleConfirmation()}
                </div>
              </div>

              {/* Recipients section */}
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 24,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ display: "flex", color: "var(--accent)" }}><IconUsers /></span>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>
                      {t("config.recipients")}
                    </h2>
                  </div>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--accent)",
                    background: "rgba(0,80,88,0.08)",
                    padding: "4px 10px",
                    borderRadius: 99,
                  }}>
                    {recipientsLabel}
                  </span>
                </div>

                {/* Recipient list */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {recipients.map((r, i) => (
                    <div key={r.id}>
                      {i > 0 && <div style={{ height: 1, background: "var(--border)" }} />}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 0",
                        gap: 12,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: avatarColors[i % avatarColors.length],
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                              {getInitials(r.name || r.email)}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{r.name}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                              {r.email}{r.role ? ` · ${r.role}` : ""}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteRecipient(r.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            display: "flex",
                            alignItems: "center",
                            padding: 4,
                            borderRadius: 4,
                            transition: "color 0.1s ease",
                          }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--error)")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)")}
                        >
                          <IconX />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {recipientLimitMsg && (
                  <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)" }}>{recipientLimitMsg}</div>
                )}

                {/* Add recipient form - always visible */}
                <div className="config-recipient-form" style={{ display: "flex", gap: 10, alignItems: "end", marginTop: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 140px" }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{t("config.recipient_name")}</label>
                    <input
                      className="input-field"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={t("config.recipient_name_placeholder")}
                      style={{ height: 40 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "2 1 200px" }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{t("config.recipient_email")}</label>
                    <input
                      className="input-field"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email@exemple.com"
                      onKeyDown={(e) => e.key === "Enter" && handleAddRecipient()}
                      style={{ height: 40 }}
                    />
                  </div>
                  <button
                    onClick={handleAddRecipient}
                    disabled={addingRecipient || !newName.trim() || !newEmail.trim()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      height: 40,
                      padding: "0 16px",
                      borderRadius: 8,
                      border: "none",
                      background: "var(--accent)",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: !newName.trim() || !newEmail.trim() ? "not-allowed" : "pointer",
                      opacity: !newName.trim() || !newEmail.trim() ? 0.5 : 1,
                      flexShrink: 0,
                    }}
                  >
                    <IconPlus />
                    {addingRecipient ? t("config.adding") : t("common.add")}
                  </button>
                </div>
              </div>

              {renderSaveButton()}
            </div>
          )}

          {/* ═══════ TAB: APPARENCE ═══════ */}
          {activeTab === "apparence" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {!isPro ? (
                /* Read-only preview for free users */
                <div style={{ position: "relative" }}>
                  <div style={{ filter: "blur(2px)", pointerEvents: "none", userSelect: "none", opacity: 0.85 }}>
                  {/* 2-column layout: controls left, preview right - READ ONLY */}
                  <div className="config-apparence-layout" style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
                    {/* LEFT - Controls (disabled) */}
                    <div className="config-apparence-controls" style={{ flex: "0 0 380px", display: "flex", flexDirection: "column", gap: 24 }}>
                      {/* Colors section */}
                      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                          <span style={{ display: "flex", color: "var(--accent)" }}><IconPalette /></span>
                          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>{t("config.tab_colors")}</h2>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {/* Primary color */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{t("custom.primary_color")}</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 12px", height: 42, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)" }}>
                              <div style={{ width: 24, height: 24, borderRadius: 6, background: "#005058" }} />
                              <span style={{ flex: 1, fontSize: 14, color: "var(--text)", fontFamily: "monospace" }}>#005058</span>
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {PRESET_COLORS.map((c) => (
                                <div key={c.value} title={c.label}
                                  style={{ width: 24, height: 24, borderRadius: "50%", background: c.value, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: c.value === "#005058" ? `0 0 0 2px white, 0 0 0 3px ${c.value}` : "0 1px 2px rgba(0,0,0,0.15)" }}>
                                  {c.value === "#005058" && (<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>)}
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Secondary colors grid */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{t("custom.title_color")}</label>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px", height: 36, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)" }}>
                                <div style={{ width: 20, height: 20, borderRadius: 4, background: "#111827" }} />
                                <span style={{ flex: 1, fontSize: 12, color: "var(--text)", fontFamily: "monospace" }}>#111827</span>
                              </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{t("custom.bg_color")}</label>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px", height: 36, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)" }}>
                                <div style={{ width: 20, height: 20, borderRadius: 4, background: "#FFFFFF", border: "1px solid #E5E7EB" }} />
                                <span style={{ flex: 1, fontSize: 12, color: "var(--text)", fontFamily: "monospace" }}>#FFFFFF</span>
                              </div>
                            </div>
                          </div>
                          {/* Body text color */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{t("custom.text_color")}</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px", height: 36, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)" }}>
                              <div style={{ width: 20, height: 20, borderRadius: 4, background: "#4B5563" }} />
                              <span style={{ flex: 1, fontSize: 12, color: "var(--text)", fontFamily: "monospace" }}>#4B5563</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Logo section */}
                      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                          <span style={{ display: "flex", color: "var(--accent)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                          </span>
                          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>{t("custom.logo_title")}</h2>
                        </div>
                        <div style={{ border: "2px dashed var(--border)", borderRadius: 10, padding: "24px 20px", textAlign: "center", background: "var(--surface-alt)" }}>
                          <span style={{ display: "flex", justifyContent: "center", color: "var(--text-muted)", marginBottom: 8 }}><IconUpload /></span>
                          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "4px 0" }}>{t("custom.logo_drop")}</p>
                          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>PNG, JPG ou SVG - Max 2 Mo</p>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT - V4 email preview */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: "0 0 12px" }}>
                        {t("custom.preview")}
                      </p>
                      <div style={{ background: "#F5F0EB", borderRadius: 12, padding: 16, border: "1px solid var(--border)" }}>
                        <div style={{ background: "#FFFFFF", borderRadius: 4, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                          {/* Header */}
                          <div style={{ padding: "14px 20px", borderBottom: "1px solid #E8E0D8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Image src="/icone.png" alt="S." width={24} height={24} />
                            <span style={{ fontSize: 10, color: "#7A7267" }}>Semaine du {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                          </div>
                          {/* Hero */}
                          <div style={{ background: "#005058", display: "flex" }}>
                            <div style={{ padding: "24px 20px 20px", flex: "0 0 65%" }}>
                              <p style={{ fontSize: 8, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>Sorell</p>
                              <p style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", margin: 0, lineHeight: 1.3 }}>Sorell automatise votre veille sectorielle</p>
                            </div>
                            <div style={{ flex: "0 0 35%", display: "flex", alignItems: "flex-end" }}>
                              <div style={{ height: 80, width: "100%", background: "rgba(255,255,255,0.08)", borderRadius: "8px 0 0 0" }}></div>
                            </div>
                          </div>
                          {/* Featured article */}
                          <div style={{ padding: "16px 20px 14px" }}>
                            <div style={{ marginBottom: 8 }}>
                              <span style={{ padding: "2px 8px", borderRadius: 4, background: "#005058", color: "white", fontSize: 7, fontWeight: 700, textTransform: "uppercase" }}>A la une</span>
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 6px", lineHeight: 1.35 }}>Sorell automatise votre veille sectorielle chaque semaine</p>
                            <p style={{ fontSize: 10, color: "#4B5563", lineHeight: 1.6, margin: "0 0 12px" }}>Sorell analyse plus de 147 sources en temps reel et genere une newsletter personnalisee pour votre secteur.</p>
                          </div>
                          {/* Key figures */}
                          <div style={{ padding: "14px 20px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              {[{ v: "147+", l: "Sources" }, { v: "12s", l: "Generation" }, { v: "30+", l: "Secteurs" }].map((f, i) => (
                                <div key={i} style={{ flex: 1, background: "#F5F0EB", border: "1px solid #E8E0D8", borderRadius: 6, padding: 8, textAlign: "center" }}>
                                  <p style={{ fontSize: 14, fontWeight: 700, color: "#005058", margin: "0 0 2px" }}>{f.v}</p>
                                  <p style={{ fontSize: 8, color: "#111827", fontWeight: 600, margin: 0 }}>{f.l}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Footer */}
                          <div style={{ padding: "12px 20px", borderTop: "1px solid #E8E0D8", background: "#F5F0EB" }}>
                            <p style={{ fontSize: 8, color: "#7A7267", margin: 0 }}>Genere par Sorell - Votre veille sectorielle par IA</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* Upgrade overlay */}
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                    background: "rgba(var(--surface-rgb, 255,255,255), 0.25)",
                    borderRadius: 12,
                  }}>
                    <div style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 16,
                      padding: "36px 40px",
                      textAlign: "center",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                      maxWidth: 420,
                    }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px",
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#D97706" stroke="#D97706" strokeWidth="1.5">
                          <path d="M2 20h20L19 9l-5 4-2-6-2 6-5-4z" />
                        </svg>
                      </div>
                      <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                        {t("custom.pro_required")}
                      </h2>
                      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
                        {t("custom.pro_desc")}
                      </p>
                      <a
                        href="/tarifs"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          background: "var(--accent)",
                          color: "#fff",
                          fontSize: 15,
                          fontWeight: 600,
                          padding: "12px 28px",
                          borderRadius: 10,
                          textDecoration: "none",
                          transition: "opacity 0.15s ease",
                        }}
                      >
                        {t("custom.see_plans")} →
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* 2-column layout: controls left, live preview right */}
                  <div className="config-apparence-layout" style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
                    {/* LEFT — Controls */}
                    <div className="config-apparence-controls" style={{ flex: "0 0 380px", display: "flex", flexDirection: "column", gap: 24 }}>
                      {/* Colors section */}
                      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                          <span style={{ display: "flex", color: "var(--accent)" }}><IconPalette /></span>
                          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>{t("config.tab_colors")}</h2>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {/* Primary color */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{t("custom.primary_color")}</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 12px", height: 42, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)" }}>
                              <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} style={{ width: 24, height: 24, border: "none", cursor: "pointer", borderRadius: 6, padding: 0 }} />
                              <input type="text" value={brandColor} onChange={(e) => { const val = e.target.value; if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setBrandColor(val); }}
                                style={{ flex: 1, border: "none", background: "transparent", fontSize: 14, color: "var(--text)", fontFamily: "monospace", outline: "none" }} />
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {PRESET_COLORS.map((c) => (
                                <button key={c.value} onClick={() => setBrandColor(c.value)} title={c.label}
                                  style={{ width: 24, height: 24, borderRadius: "50%", background: c.value, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: brandColor === c.value ? `0 0 0 2px white, 0 0 0 3px ${c.value}` : "0 1px 2px rgba(0,0,0,0.15)", padding: 0 }}>
                                  {brandColor === c.value && (<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>)}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* Secondary colors grid */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{t("custom.title_color")}</label>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px", height: 36, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)" }}>
                                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ width: 20, height: 20, border: "none", cursor: "pointer", borderRadius: 4, padding: 0 }} />
                                <input type="text" value={textColor} onChange={(e) => { const val = e.target.value; if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setTextColor(val); }}
                                  style={{ flex: 1, border: "none", background: "transparent", fontSize: 12, color: "var(--text)", fontFamily: "monospace", outline: "none" }} />
                              </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{t("custom.bg_color")}</label>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px", height: 36, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)" }}>
                                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ width: 20, height: 20, border: "none", cursor: "pointer", borderRadius: 4, padding: 0 }} />
                                <input type="text" value={bgColor} onChange={(e) => { const val = e.target.value; if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setBgColor(val); }}
                                  style={{ flex: 1, border: "none", background: "transparent", fontSize: 12, color: "var(--text)", fontFamily: "monospace", outline: "none" }} />
                              </div>
                            </div>
                          </div>
                          {/* Body text color */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{t("custom.text_color")}</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px", height: 36, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)" }}>
                              <input type="color" value={bodyTextColor} onChange={(e) => setBodyTextColor(e.target.value)} style={{ width: 20, height: 20, border: "none", cursor: "pointer", borderRadius: 4, padding: 0 }} />
                              <input type="text" value={bodyTextColor} onChange={(e) => { const val = e.target.value; if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setBodyTextColor(val); }}
                                style={{ flex: 1, border: "none", background: "transparent", fontSize: 12, color: "var(--text)", fontFamily: "monospace", outline: "none" }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Logo section */}
                      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, position: "relative", opacity: canUseLogo ? 1 : 0.6, pointerEvents: canUseLogo ? "auto" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ display: "flex", color: "var(--accent)" }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                            </span>
                            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", margin: 0 }}>{t("custom.logo_title")}</h2>
                          </div>
                          {!canUseLogo && (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, background: "#FEF3C7", padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, color: "#D97706" }}>
                              <CrownIcon /> Business
                            </span>
                          )}
                        </div>
                        <div onDragOver={(e) => e.preventDefault()} onDrop={handleLogoDrop} onClick={() => document.getElementById("logo-input")?.click()}
                          style={{ border: "2px dashed var(--border)", borderRadius: 10, padding: "24px 20px", textAlign: "center", cursor: "pointer", background: "var(--surface-alt)", transition: "border-color 0.2s" }}>
                          {logoPreview || logoUrl ? (
                            <div>
                              <Image src={logoPreview || logoUrl} alt="Logo" width={200} height={50} unoptimized style={{ maxHeight: 50, maxWidth: 200, width: "auto", height: "auto", marginBottom: 12 }} />
                              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "8px 0 0" }}>{t("custom.logo_replace")}</p>
                            </div>
                          ) : (
                            <div>
                              <span style={{ display: "flex", justifyContent: "center", color: "var(--text-muted)", marginBottom: 8 }}><IconUpload /></span>
                              <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "4px 0" }}>{t("custom.logo_drop")}</p>
                              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>PNG, JPG ou SVG - Max 2 Mo</p>
                            </div>
                          )}
                          <input id="logo-input" type="file" accept="image/png,image/svg+xml,image/jpeg" style={{ display: "none" }} onChange={handleLogoSelect} />
                        </div>
                        {(logoUrl || logoPreview) && (
                          <button onClick={() => { setLogoUrl(""); setLogoPreview(null); setLogoFile(null); }}
                            style={{ marginTop: 8, fontSize: 13, color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                            {t("custom.logo_delete")}
                          </button>
                        )}
                      </div>

                      {renderSaveButton()}
                    </div>

                    {/* RIGHT — Live V4 email preview */}
                    <div style={{ flex: 1, minWidth: 0, position: "sticky", top: 24 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: "0 0 12px" }}>
                        {t("custom.preview")}
                      </p>
                      <div style={{ background: "#F5F0EB", borderRadius: 12, padding: 16, border: "1px solid var(--border)" }}>
                        <div style={{ background: bgColor, borderRadius: 4, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                          {/* Header */}
                          <div style={{ padding: "14px 20px", borderBottom: "1px solid #E8E0D8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            {(canUseLogo && (logoPreview || logoUrl)) ? (
                              <Image src={logoPreview || logoUrl} alt="Logo" width={120} height={24} unoptimized style={{ maxHeight: 24, maxWidth: 120, width: "auto", height: "auto" }} />
                            ) : (
                              <Image src="/icone.png" alt="S." width={24} height={24} />
                            )}
                            <span style={{ fontSize: 10, color: "#7A7267" }}>Semaine du {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                          </div>
                          {/* Hero */}
                          <div style={{ background: brandColor, display: "flex" }}>
                            <div style={{ padding: "24px 20px 20px", flex: "0 0 65%" }}>
                              <p style={{ fontSize: 8, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>Semaine du {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · Sorell</p>
                              <p style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", margin: 0, lineHeight: 1.3 }}>Sorell automatise votre veille sectorielle chaque semaine</p>
                            </div>
                            <div style={{ flex: "0 0 35%", display: "flex", alignItems: "flex-end" }}>
                              <div style={{ height: 80, width: "100%", background: "rgba(255,255,255,0.08)", borderRadius: "8px 0 0 0" }}></div>
                            </div>
                          </div>
                          {/* Featured article */}
                          <div style={{ padding: "16px 20px 14px" }}>
                            <div style={{ marginBottom: 8, display: "flex", gap: 6 }}>
                              <span style={{ padding: "2px 8px", borderRadius: 4, background: brandColor, color: "white", fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>A la une</span>
                              <span style={{ padding: "2px 6px", borderRadius: 4, background: "#F5F0EB", color: "#7A7267", fontSize: 7, fontWeight: 600, textTransform: "uppercase" }}>Veille IA</span>
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: textColor, margin: "0 0 6px", lineHeight: 1.35 }}>Sorell automatise votre veille sectorielle chaque semaine</p>
                            <p style={{ fontSize: 10, color: "#7A7267", margin: "0 0 8px", fontStyle: "italic", lineHeight: 1.5 }}>Plus besoin de faire votre veille. Sorell l&apos;a d&eacute;j&agrave; faite.</p>
                            <p style={{ fontSize: 10, color: bodyTextColor, lineHeight: 1.6, margin: "0 0 12px" }}>Sorell analyse plus de 147 sources en temps r&eacute;el et g&eacute;n&egrave;re une newsletter personnalis&eacute;e pour votre secteur en 12 secondes.</p>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ padding: "6px 14px", background: brandColor, color: "white", fontSize: 9, fontWeight: 600, borderRadius: 5 }}>D&eacute;couvrir Sorell →</span>
                              <span style={{ fontSize: 9, color: "#7A7267" }}>sorell.fr</span>
                            </div>
                          </div>
                          <div style={{ padding: "0 20px" }}><div style={{ borderTop: "1px solid #E8E0D8" }}></div></div>
                          {/* Editorial */}
                          <div style={{ padding: "14px 20px" }}>
                            <div style={{ borderLeft: `3px solid ${brandColor}`, padding: "10px 14px", background: "#F5F0EB", borderRadius: "0 6px 6px 0" }}>
                              <p style={{ fontSize: 8, fontWeight: 600, color: brandColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Le point de vue</p>
                              <p style={{ fontSize: 10, color: bodyTextColor, lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>La veille sectorielle n&apos;est plus un luxe r&eacute;serv&eacute; aux grandes entreprises. Avec Sorell, chaque dirigeant de PME re&ccedil;oit une synth&egrave;se claire et actionnable.</p>
                            </div>
                          </div>
                          <div style={{ padding: "0 20px" }}><div style={{ borderTop: "1px solid #E8E0D8" }}></div></div>
                          {/* Key figures */}
                          <div style={{ padding: "14px 20px" }}>
                            <p style={{ fontSize: 8, fontWeight: 600, color: brandColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Chiffres cl&eacute;s</p>
                            <div style={{ display: "flex", gap: 6 }}>
                              {[{ v: "147+", l: "Sources", c: "en temps r\u00e9el" }, { v: "12s", l: "G\u00e9n\u00e9ration", c: "par newsletter" }, { v: "30+", l: "Secteurs", c: "et sur-mesure" }].map((f, i) => (
                                <div key={i} style={{ flex: 1, background: "#F5F0EB", border: "1px solid #E8E0D8", borderRadius: 6, padding: 8, textAlign: "center" }}>
                                  <p style={{ fontSize: 14, fontWeight: 700, color: brandColor, margin: "0 0 2px" }}>{f.v}</p>
                                  <p style={{ fontSize: 8, color: textColor, fontWeight: 600, margin: "0 0 1px" }}>{f.l}</p>
                                  <p style={{ fontSize: 7, color: "#7A7267", margin: 0 }}>{f.c}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div style={{ padding: "0 20px" }}><div style={{ borderTop: "1px solid #E8E0D8" }}></div></div>
                          {/* Secondary articles */}
                          <div style={{ padding: "14px 20px 6px" }}>
                            <p style={{ fontSize: 8, fontWeight: 600, color: brandColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>A lire aussi</p>
                            {[{ tag: "Fonctionnalit\u00e9", src: "Sorell", title: "Personnalisez vos newsletters avec votre identit\u00e9 visuelle", desc: "Couleurs, logo, fr\u00e9quence d\u2019envoi : chaque newsletter Sorell est adapt\u00e9e \u00e0 votre marque." },
                              { tag: "Produit", src: "Sorell", title: "Sources custom et analytics : gardez le contr\u00f4le", desc: "Ajoutez vos propres sources, suivez les taux d\u2019ouverture et de clic." }].map((a, i) => (
                              <div key={i} style={{ border: "1px solid #E8E0D8", borderRadius: 6, padding: 12, marginBottom: 10, background: bgColor }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                  <span style={{ padding: "1px 6px", borderRadius: 3, background: "#F5F0EB", color: "#7A7267", fontSize: 7, fontWeight: 700, textTransform: "uppercase" }}>{a.tag}</span>
                                  <span style={{ fontSize: 8, color: "#7A7267" }}>{a.src}</span>
                                </div>
                                <p style={{ fontSize: 11, fontWeight: 600, color: textColor, margin: "0 0 4px", lineHeight: 1.35 }}>{a.title}</p>
                                <p style={{ fontSize: 9, color: bodyTextColor, lineHeight: 1.5, margin: "0 0 8px" }}>{a.desc}</p>
                                <span style={{ fontSize: 8, color: brandColor, fontWeight: 600 }}>Lire la suite →</span>
                              </div>
                            ))}
                          </div>
                          {/* CTA */}
                          <div style={{ padding: "2px 20px 16px" }}>
                            <div style={{ borderRadius: 6, background: brandColor, display: "flex", overflow: "hidden" }}>
                              <div style={{ padding: "16px 16px 16px 20px", flex: "0 0 65%" }}>
                                <p style={{ fontSize: 11, fontWeight: 600, color: "#FFFFFF", margin: "0 0 4px", lineHeight: 1.4 }}>Essayez Sorell gratuitement</p>
                                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", margin: "0 0 10px", lineHeight: 1.4 }}>1 newsletter par mois, sans engagement.</p>
                                <span style={{ display: "inline-block", padding: "6px 14px", background: "white", color: brandColor, fontSize: 9, fontWeight: 600, borderRadius: 5 }}>Commencer →</span>
                              </div>
                              <div style={{ flex: "0 0 35%", display: "flex", alignItems: "flex-end" }}>
                                <div style={{ height: 60, width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: "6px 0 0 0" }}></div>
                              </div>
                            </div>
                          </div>
                          {/* Footer */}
                          <div style={{ padding: "12px 20px", borderTop: "1px solid #E8E0D8", background: "#F5F0EB" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                              {(canUseLogo && (logoPreview || logoUrl)) ? (
                                <Image src={logoPreview || logoUrl} alt="Logo" width={80} height={16} unoptimized style={{ maxHeight: 16, maxWidth: 80, width: "auto", height: "auto" }} />
                              ) : (
                                <Image src="/icone.png" alt="S." width={16} height={16} />
                              )}
                              <span style={{ fontSize: 9, color: brandColor }}>sorell.fr</span>
                            </div>
                            <p style={{ fontSize: 8, color: "#7A7267", margin: 0 }}>G&eacute;n&eacute;r&eacute; par Sorell · Votre veille sectorielle par IA</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Global feedback messages */}
          {saved && (
            <div style={{
              marginTop: 16,
              padding: "16px 20px",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: 10,
              fontSize: 14,
              color: "#059669",
              lineHeight: 1.6,
              textAlign: "center",
            }}>
              <p style={{ fontWeight: 600, margin: "0 0 4px" }}>{t("config.saved_title")}</p>
              <p style={{ margin: 0, fontSize: 13 }}>{t("config.saved_desc")}</p>
            </div>
          )}
          {instantSending && (
            <NewsletterLoader active={instantSending} style={{ marginTop: 16 }} />
          )}
          {instantSent && (
            <div style={{ marginTop: 16, padding: "16px 20px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, fontSize: 14, color: "#059669", textAlign: "center" }}>
              {t("config.instant_sent")}
            </div>
          )}
          {instantError && (
            <div style={{ marginTop: 16, padding: "16px 20px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, fontSize: 14, color: "#EF4444", textAlign: "center" }}>
              {instantError}
            </div>
          )}
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .config-page-container {
            padding: 20px 16px !important;
          }
          .config-tab-bar {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            gap: 0 !important;
          }
          .config-tab-bar::-webkit-scrollbar {
            display: none;
          }
          .config-tab-bar button {
            white-space: nowrap;
            flex-shrink: 0;
            padding: 10px 14px !important;
            font-size: 13px !important;
          }
          .config-apparence-layout {
            flex-direction: column !important;
          }
          .config-apparence-controls {
            flex: 1 1 auto !important;
            min-width: 0 !important;
          }
          .config-recipient-form {
            flex-direction: column !important;
          }
          .config-recipient-form > * {
            flex: 1 1 auto !important;
          }
        }
      `}</style>
    </div>
  );

  function renderSaveButton() {
    return (
      <>
        {saveError && (
          <p style={{ fontSize: 13, color: "var(--error)", margin: 0 }}>{saveError}</p>
        )}
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            height: 44,
            borderRadius: 10,
            border: "none",
            background: "var(--accent)",
            color: "white",
            fontSize: 15,
            fontWeight: 600,
            cursor: saving || uploading ? "not-allowed" : "pointer",
            opacity: saving || uploading ? 0.7 : 1,
            transition: "opacity 0.15s ease",
          }}
        >
          <IconSave />
          {uploading ? t("custom.uploading") : saving ? t("common.saving") : t("config.save_tab_" + activeTab)}
        </button>
      </>
    );
  }
}
