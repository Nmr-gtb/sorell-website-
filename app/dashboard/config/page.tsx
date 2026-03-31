"use client";

import { useState, useEffect } from "react";
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
import CrownBadge from "@/components/CrownBadge";
import { useDevMode } from "@/lib/DevModeContext";
import { DEFAULT_TOPICS } from "@/lib/topics";
import { authFetch } from "@/lib/api";

const ALL_SOURCES = [
  "Les Echos",
  "Le Monde",
  "Le Figaro",
  "BFM Business",
  "La Tribune",
  "Challenges",
  "Financial Times",
  "Bloomberg",
  "Reuters",
  "The Economist",
  "Harvard Business Review",
  "TechCrunch",
  "The Verge",
  "Wired",
  "MIT Technology Review",
  "L'Usine Digitale",
  "Maddyness",
  "FrenchWeb",
  "Capital",
  "Investir",
  "McKinsey Insights",
  "Gartner",
  "Forrester",
  "The Lancet",
  "Nature",
  "INSERM",
  "Medscape",
  "L'Usine Nouvelle",
  "LSA Commerce",
  "Stratégies",
  "CB News",
  "Mind Media",
];


const defaultTopics = DEFAULT_TOPICS;

const defaultSources = ["Les Echos", "TechCrunch", "McKinsey Insights"];

type Recipient = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: enabled ? "var(--accent)" : "var(--border)",
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: enabled ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "white",
          transition: "left 0.2s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function ConfigPage() {
  const { user } = useAuth();

  const [topics, setTopics] = useState(defaultTopics);
  const [sources, setSources] = useState(defaultSources);
  const [newSource, setNewSource] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [sendDay, setSendDay] = useState("monday");
  const [sendHour, setSendHour] = useState(9);
  const [customBrief, setCustomBrief] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [realPlan, setRealPlan] = useState<string>("free");
  const { getEffectivePlan } = useDevMode();

  const [sendDay2, setSendDay2] = useState("thursday");
  const [instantSending, setInstantSending] = useState(false);
  const [instantSent, setInstantSent] = useState(false);
  const [instantError, setInstantError] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

const [showAddTopic, setShowAddTopic] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [newTopicLabel, setNewTopicLabel] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("");
  const [addingRecipient, setAddingRecipient] = useState(false);
  const [recipientLimitMsg, setRecipientLimitMsg] = useState("");

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
        if (cfg.topics && cfg.topics.length > 0) {
          setTopics(cfg.topics);
        }
        if (cfg.sources && cfg.sources.length > 0) {
          setSources(cfg.sources);
        }
        if (cfg.frequency) {
          setFrequency(cfg.frequency);
        }
        if (cfg.send_day) {
          if (cfg.frequency === "biweekly" && cfg.send_day.includes(",")) {
            const parts = cfg.send_day.split(",");
            setSendDay(parts[0].trim());
            setSendDay2(parts[1].trim());
          } else {
            setSendDay(cfg.send_day);
          }
        }
        if (cfg.send_hour !== undefined && cfg.send_hour !== null) {
          setSendHour(cfg.send_hour);
        }
        if (cfg.custom_brief) {
          setCustomBrief(cfg.custom_brief);
        }
      }

      let loadedRecipients = recipientsResult.data ?? [];

      if (loadedRecipients.length === 0 && user?.email) {
        await supabase.from("recipients").upsert(
          {
            user_id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || "",
            role: "",
          },
          { onConflict: "user_id,email" }
        );
        const { data: refreshed } = await supabase
          .from("recipients")
          .select("*")
          .eq("user_id", user.id);
        loadedRecipients = refreshed ?? [];
      }

      setRecipients(loadedRecipients);

      setLoading(false);
    }

    loadData();
  }, [user]);

  const plan = getEffectivePlan(realPlan);
  const limits = getPlanLimits(plan);

  const toggleTopic = (id: string) => {
    setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
  };

  const addCustomTopic = () => {
    const trimmed = newTopicLabel.trim();
    if (!trimmed) return;
    const id = `custom-${Date.now()}`;
    setTopics((prev) => [...prev, { id, label: trimmed, enabled: true }]);
    setNewTopicLabel("");
    setShowAddTopic(false);
  };

  const removeTopic = (id: string) => {
    setTopics((prev) => prev.filter((t) => t.id !== id));
  };

  const addSource = () => {
    const trimmed = newSource.trim();
    if (trimmed && !sources.includes(trimmed)) {
      setSources((prev) => [...prev, trimmed]);
      setNewSource("");
    }
  };

  const removeSource = (s: string) => setSources((prev) => prev.filter((x) => x !== s));

  const addCuratedSource = (s: string) => {
    if (!sources.includes(s)) {
      setSources((prev) => [...prev, s]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError("");

    let savedFrequency = frequency;
    let savedSendDay = sendDay;
    let savedSendHour = sendHour;

    if (plan === "free") {
      savedFrequency = "bimonthly";
      savedSendDay = "1st-15th";
    } else if (plan === "pro") {
      savedFrequency = "weekly";
    } else if ((plan === "business" || plan === "enterprise") && frequency === "biweekly") {
      savedSendDay = `${sendDay},${sendDay2}`;
    }

    const { error } = await upsertNewsletterConfig(user.id, {
      topics, sources, frequency: savedFrequency, custom_brief: customBrief,
      send_day: savedSendDay, send_hour: savedSendHour,
    });
    setSaving(false);
    if (error) {
      setSaveError("Erreur lors de la sauvegarde. Veuillez réessayer.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);

      // Instant newsletter on first configuration
      const { count } = await supabase
        .from("newsletters")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (count === 0) {
        setInstantSending(true);
        setInstantError("");
        try {
          const enabledTopics = topics.filter((t) => t.enabled);
          const genRes = await authFetch("/api/generate", {
            method: "POST",
            body: JSON.stringify({ userId: user.id, topics: enabledTopics, sources, customBrief }),
          });
          if (genRes.status === 429) {
            setInstantError("Vous avez atteint la limite de requetes. Reessayez dans une heure.");
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
        } catch (e) {
          // silently ignore
        }
        setInstantSending(false);
      }
    }
  };

  const handleAddRecipient = async () => {
    if (!user || !newName.trim() || !newEmail.trim()) return;

    const maxR = limits.maxRecipients;
    if (maxR !== -1 && recipients.length >= maxR) {
      setRecipientLimitMsg(
        plan === "free"
          ? `Limite de ${maxR} destinataire atteinte. Passez au plan Pro pour en ajouter jusqu'à 5.`
          : plan === "pro"
          ? `Limite de ${maxR} destinataires atteinte. Passez au plan Business pour en ajouter jusqu'à 25.`
          : `Limite de ${maxR} destinataires atteinte. Passez au plan supérieur pour en ajouter plus.`
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
      setShowAddForm(false);
      setRecipientLimitMsg("");
    }
  };

  const handleDeleteRecipient = async (id: string) => {
    const { error } = await deleteRecipient(id);
    if (!error) {
      setRecipients((prev) => prev.filter((r) => r.id !== id));
      setRecipientLimitMsg("");
    }
  };

  const maxR = limits.maxRecipients;
  const recipientsLabel = maxR === -1
    ? `${recipients.length} destinataire${recipients.length > 1 ? "s" : ""}`
    : `${recipients.length} / ${maxR} destinataire${maxR > 1 ? "s" : ""}`;

  return (
    <div style={{ padding: 32, maxWidth: 700 }}>
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
          Configuration newsletter
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Personnalisez le contenu que vos équipes reçoivent
        </p>
      </div>

      <div style={{
        padding: "12px 16px",
        background: "rgba(0,80,88,0.04)",
        border: "1px solid rgba(0,80,88,0.1)",
        borderRadius: 8,
        marginBottom: 20,
        fontSize: 13,
        color: "var(--text-secondary)",
        lineHeight: 1.5,
      }}>
        Vous pouvez modifier votre configuration à tout moment. Les changements seront appliqués dès votre prochaine newsletter.
      </div>

      {loading ? (
        <div style={{ fontSize: 14, color: "var(--text-muted)", padding: "24px 0" }}>
          Chargement...
        </div>
      ) : (
        <>
          {/* Topics card */}
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
              Thématiques
            </h2>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {topics.map((topic, i) => (
                <div key={topic.id}>
                  {i > 0 && <div style={{ height: 1, background: "var(--border)" }} />}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 0",
                    }}
                  >
                    <span style={{ fontSize: 14, color: "var(--text)" }}>{topic.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {topic.id.startsWith("custom-") && (
                        <button
                          onClick={() => removeTopic(topic.id)}
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
                      )}
                      <Toggle enabled={topic.enabled} onChange={() => toggleTopic(topic.id)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              {showAddTopic ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                  <input
                    className="input-field"
                    value={newTopicLabel}
                    onChange={(e) => setNewTopicLabel(e.target.value)}
                    placeholder="Ex: Blockchain, Supply Chain, IoT..."
                    onKeyDown={(e) => e.key === "Enter" && addCustomTopic()}
                    autoFocus
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn-primary"
                      onClick={addCustomTopic}
                      disabled={!newTopicLabel.trim()}
                      style={{ fontSize: 13, padding: "6px 14px" }}
                    >
                      Ajouter
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => { setShowAddTopic(false); setNewTopicLabel(""); }}
                      style={{ fontSize: 13, padding: "6px 14px" }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn-ghost"
                  onClick={() => setShowAddTopic(true)}
                  style={{ fontSize: 13, padding: "6px 14px" }}
                >
                  + Ajouter une thématique
                </button>
              )}
            </div>
          </div>

          {/* Custom brief card */}
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
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Brief personnalisé
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
              Décrivez votre entreprise et ce qui vous intéresse. Plus c&apos;est précis, plus votre newsletter sera variée.
            </p>

            <textarea
              className="input-field"
              value={customBrief}
              onChange={(e) => setCustomBrief(e.target.value.slice(0, 1000))}
              placeholder={`Ex : Nous sommes un cabinet de recrutement spécialisé IT en Île-de-France. Concurrents : Hays, Michael Page, Robert Half. Clients : PME et ETI du secteur tech.\nJe veux suivre : marché de l'emploi tech en France, nouvelles réglementations RH et droit du travail, levées de fonds des startups qui recrutent, tendances télétravail et salaires, IA appliquée au recrutement.`}
              style={{ width: "100%", minHeight: 160, resize: "vertical", boxSizing: "border-box" }}
            />
            <div style={{
              marginTop: 12,
              padding: "12px 16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--text-muted)",
              lineHeight: 1.6,
            }}>
              <span style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: 12 }}>Astuce : mentionnez...</span>
              <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
                <span>• Vos concurrents (par nom)</span>
                <span>• Vos clients importants</span>
                <span>• Les réglementations à suivre</span>
                <span>• Les innovations qui vous intéressent</span>
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
              {customBrief.length} / 1000
            </div>
          </div>

          {/* Sources card */}
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
              Sources préférées
            </h2>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                className="input-field"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="Ajouter une source (ex: techcrunch.com)"
                onKeyDown={(e) => e.key === "Enter" && addSource()}
                style={{ flex: 1 }}
              />
              <button
                className="btn-ghost"
                onClick={addSource}
                style={{ fontSize: 14, padding: "7px 16px", flexShrink: 0 }}
              >
                Ajouter
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sources.map((s) => (
                <div
                  key={s}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "var(--surface-alt)",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontSize: 14, color: "var(--text)" }}>{s}</span>
                  <button
                    onClick={() => removeSource(s)}
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
              ))}
            </div>

            {/* Curated sources library */}
            <div style={{ marginTop: 20 }}>
              <button
                onClick={() => setShowSourcePicker(!showSourcePicker)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: showSourcePicker ? "8px 8px 0 0" : 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text)",
                }}
              >
                <span>Sélectionner parmi nos sources vérifiées</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {sources.length > 0 && (
                    <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>
                      {sources.length} source{sources.length > 1 ? "s" : ""}
                    </span>
                  )}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    style={{ color: "var(--text-muted)", transform: showSourcePicker ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </button>
              {showSourcePicker && (
                <div style={{
                  border: "1px solid var(--border)",
                  borderTop: "none",
                  borderRadius: "0 0 8px 8px",
                  maxHeight: 280,
                  overflowY: "auto",
                  background: "var(--surface)",
                }}>
                  {ALL_SOURCES.map((source, index) => {
                    const isSelected = sources.includes(source);
                    return (
                      <button
                        key={source}
                        onClick={() => {
                          if (isSelected) {
                            setSources(sources.filter(s => s !== source));
                          } else {
                            setSources([...sources, source]);
                          }
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 14px",
                          background: isSelected ? "rgba(0,80,88,0.04)" : "transparent",
                          border: "none",
                          borderBottom: index < ALL_SOURCES.length - 1 ? "1px solid var(--border)" : "none",
                          cursor: "pointer",
                          fontSize: 13,
                          color: isSelected ? "var(--accent)" : "var(--text)",
                          fontWeight: isSelected ? 500 : 400,
                          textAlign: "left",
                        }}
                      >
                        <span>{source}</span>
                        {isSelected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12l5 5L20 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Scheduling card */}
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
              Planification de l&apos;envoi
            </h2>

            {plan === "free" ? (
              <>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
                  Vos newsletters sont envoyées le 1er et le 15 de chaque mois.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 200 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>Créneau d&apos;envoi</label>
                  <select
                    className="select-field"
                    value={sendHour}
                    onChange={(e) => setSendHour(Number(e.target.value))}
                  >
                    <option value={8}>Matin (8h)</option>
                    <option value={12}>Midi (12h)</option>
                    <option value={18}>Soir (18h)</option>
                  </select>
                </div>
              </>
            ) : plan === "pro" ? (
              <>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
                  Choisissez votre jour et heure d&apos;envoi.
                </p>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 140px" }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>Jour</label>
                    <select className="select-field" value={sendDay} onChange={(e) => setSendDay(e.target.value)}>
                      <option value="monday">Lundi</option>
                      <option value="tuesday">Mardi</option>
                      <option value="wednesday">Mercredi</option>
                      <option value="thursday">Jeudi</option>
                      <option value="friday">Vendredi</option>
                      <option value="saturday">Samedi</option>
                      <option value="sunday">Dimanche</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 100px" }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>Heure</label>
                    <select className="select-field" value={sendHour} onChange={(e) => setSendHour(Number(e.target.value))}>
                      {Array.from({ length: 15 }, (_, i) => i + 6).map((h) => (
                        <option key={h} value={h}>{h}h00</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
                  Planification avancée
                </p>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 160px" }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>Fréquence</label>
                    <select
                      className="select-field"
                      value={frequency}
                      onChange={(e) => {
                        setFrequency(e.target.value);
                        if (e.target.value === "weekly" || e.target.value === "biweekly") setSendDay("monday");
                      }}
                    >
                      <option value="weekly">1 fois par semaine</option>
                      <option value="biweekly">2 fois par semaine</option>
                      <option value="daily">Tous les jours (lun-ven)</option>
                    </select>
                  </div>
                  {(frequency === "weekly" || frequency === "biweekly") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 120px" }}>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
                        {frequency === "biweekly" ? "1er jour" : "Jour"}
                      </label>
                      <select className="select-field" value={sendDay} onChange={(e) => setSendDay(e.target.value)}>
                        <option value="monday">Lundi</option>
                        <option value="tuesday">Mardi</option>
                        <option value="wednesday">Mercredi</option>
                        <option value="thursday">Jeudi</option>
                        <option value="friday">Vendredi</option>
                      </select>
                    </div>
                  )}
                  {frequency === "biweekly" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 120px" }}>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>2e jour</label>
                      <select className="select-field" value={sendDay2} onChange={(e) => setSendDay2(e.target.value)}>
                        <option value="monday">Lundi</option>
                        <option value="tuesday">Mardi</option>
                        <option value="wednesday">Mercredi</option>
                        <option value="thursday">Jeudi</option>
                        <option value="friday">Vendredi</option>
                      </select>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 100px" }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>Heure</label>
                    <select
                      className="select-field"
                      value={sendHour}
                      onChange={(e) => setSendHour(Number(e.target.value))}
                    >
                      {Array.from({ length: 29 }, (_, i) => 6 + i * 0.5).map((h) => (
                        <option key={h} value={h}>
                          {Math.floor(h)}h{h % 1 === 0.5 ? "30" : "00"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div style={{
              marginTop: 12,
              padding: "10px 14px",
              background: "rgba(16,185,129,0.06)",
              border: "1px solid rgba(16,185,129,0.15)",
              borderRadius: 8,
              fontSize: 13,
              color: "#059669",
              lineHeight: 1.5,
            }}>
              {plan === "free"
                ? `✓ Votre newsletter sera envoyée le 1er et le 15 de chaque mois à ${sendHour}h00. Aucune action requise.`
                : plan === "pro"
                ? (() => {
                    const dayLabels: Record<string, string> = { monday: "lundi", tuesday: "mardi", wednesday: "mercredi", thursday: "jeudi", friday: "vendredi", saturday: "samedi", sunday: "dimanche" };
                    return `✓ Votre newsletter sera envoyée chaque ${dayLabels[sendDay] || sendDay} à ${sendHour}h00. Aucune action requise.`;
                  })()
                : frequency === "daily"
                ? `✓ Votre newsletter sera envoyée chaque jour (lun-ven) à ${Math.floor(sendHour)}h${sendHour % 1 === 0.5 ? "30" : "00"}. Aucune action requise.`
                : frequency === "biweekly"
                ? (() => {
                    const dayLabels: Record<string, string> = { monday: "lundi", tuesday: "mardi", wednesday: "mercredi", thursday: "jeudi", friday: "vendredi" };
                    return `✓ Votre newsletter sera envoyée chaque ${dayLabels[sendDay] || sendDay} et ${dayLabels[sendDay2] || sendDay2} à ${Math.floor(sendHour)}h${sendHour % 1 === 0.5 ? "30" : "00"}. Aucune action requise.`;
                  })()
                : (() => {
                    const dayLabels: Record<string, string> = { monday: "lundi", tuesday: "mardi", wednesday: "mercredi", thursday: "jeudi", friday: "vendredi" };
                    return `✓ Votre newsletter sera envoyée chaque ${dayLabels[sendDay] || sendDay} à ${Math.floor(sendHour)}h${sendHour % 1 === 0.5 ? "30" : "00"}. Aucune action requise.`;
                  })()
              }
            </div>
          </div>

          {/* Recipients card */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  margin: 0,
                }}
              >
                Destinataires
              </h2>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{recipientsLabel}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {recipients.map((r, i) => (
                <div key={r.id}>
                  {i > 0 && <div style={{ height: 1, background: "var(--border)" }} />}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>
                        {r.name}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        {r.email}{r.role ? ` · ${r.role}` : ""}
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
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>{recipientLimitMsg}</p>
                <CrownBadge tooltip="Augmentez votre limite de destinataires" />
              </div>
            )}

            {showAddForm ? (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    className="input-field"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nom"
                    style={{ flex: "1 1 140px" }}
                  />
                  <input
                    className="input-field"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Email"
                    style={{ flex: "2 1 200px" }}
                  />
                  <input
                    className="input-field"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Rôle (ex: CEO, Marketing...)"
                    style={{ flex: "1 1 160px" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn-primary"
                    onClick={handleAddRecipient}
                    disabled={addingRecipient || !newName.trim() || !newEmail.trim()}
                    style={{ fontSize: 13, padding: "6px 14px" }}
                  >
                    {addingRecipient ? "Ajout..." : "Ajouter"}
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewName("");
                      setNewEmail("");
                      setNewRole("");
                      setRecipientLimitMsg("");
                    }}
                    style={{ fontSize: 13, padding: "6px 14px" }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                <button
                  className="btn-ghost"
                  onClick={() => {
                    const maxR = limits.maxRecipients;
                    if (maxR !== -1 && recipients.length >= maxR) {
                      setRecipientLimitMsg(
                        plan === "free"
                          ? `Limite de ${maxR} destinataire atteinte. Passez au plan Pro pour en ajouter jusqu'à 10.`
                          : `Limite de ${maxR} destinataires atteinte. Passez au plan supérieur pour en ajouter plus.`
                      );
                    } else {
                      setShowAddForm(true);
                      setRecipientLimitMsg("");
                    }
                  }}
                  style={{ fontSize: 13, padding: "6px 14px" }}
                >
                  + Ajouter un destinataire
                </button>
              </div>
            )}
          </div>

          {/* Save button */}
          {saveError && (
            <p style={{ fontSize: 13, color: "var(--error)", marginBottom: 12 }}>{saveError}</p>
          )}
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ width: "100%", fontSize: 15 }}
          >
            {saving ? "Sauvegarde..." : "Sauvegarder les modifications"}
          </button>
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
              <p style={{ fontWeight: 600, margin: "0 0 4px" }}>Configuration sauvegardée</p>
              <p style={{ margin: 0, fontSize: 13 }}>
                Votre newsletter sera envoyée automatiquement. Vous n&apos;avez plus rien à faire.
              </p>
            </div>
          )}
          {instantSending && (
            <div style={{ marginTop: 16, padding: "16px 20px", background: "rgba(0,80,88,0.04)", border: "1px solid rgba(0,80,88,0.1)", borderRadius: 10, fontSize: 14, color: "var(--text-secondary)", textAlign: "center" }}>
              Génération de votre première newsletter en cours...
            </div>
          )}
          {instantSent && (
            <div style={{ marginTop: 16, padding: "16px 20px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, fontSize: 14, color: "#059669", textAlign: "center" }}>
              Votre première newsletter a été envoyée ! Vérifiez votre boîte mail.
            </div>
          )}
          {instantError && (
            <div style={{ marginTop: 16, padding: "16px 20px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, fontSize: 14, color: "#EF4444", textAlign: "center" }}>
              {instantError}
            </div>
          )}
        </>
      )}
    </div>
  );
}
