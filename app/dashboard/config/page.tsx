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
import { getPlanLimits } from "@/lib/plans";
import CrownBadge from "@/components/CrownBadge";
import { useDevMode } from "@/lib/DevModeContext";

const CURATED_SOURCES: Record<string, string[]> = {
  "Généraliste": ["Les Echos", "Le Monde", "Le Figaro", "La Tribune", "BFM Business", "Challenges"],
  "Tech & Innovation": ["TechCrunch", "The Verge", "Wired", "MIT Technology Review", "L'Usine Digitale", "Maddyness", "FrenchWeb"],
  "Finance & Économie": ["Financial Times", "Bloomberg", "Reuters", "Capital", "Investir"],
  "Santé & Sciences": ["The Lancet", "Nature", "INSERM", "Medscape"],
  "International": ["The Economist", "Harvard Business Review", "McKinsey Insights", "Gartner", "Forrester"],
  "Spécialisé": ["L'Usine Nouvelle", "LSA Commerce", "Stratégies", "CB News", "Mind Media"],
};

const BRIEF_EXAMPLES = [
  {
    sector: "Cosmétique & Packaging",
    icon: "🧴",
    brief: "Notre entreprise fait de la remise en forme de packaging cosmétique (surimpression de listes INCI, étiquetage réglementaire). Je veux suivre chaque semaine : les changements réglementaires européens sur les listes INCI, les nouvelles normes d'étiquetage cosmétique, les rappels produits liés au packaging, et les innovations en impression/packaging durable. Nos concurrents : Autajon, CCL Industries.",
  },
  {
    sector: "SaaS & Tech B2B",
    icon: "💻",
    brief: "Nous développons un logiciel de gestion de projet pour les PME. Je veux suivre : les levées de fonds et acquisitions dans le secteur project management (Monday, Asana, Notion, ClickUp), les nouvelles fonctionnalités IA intégrées aux outils de productivité, les tendances du marché SaaS B2B en Europe, et les retours d'expérience clients sur l'adoption d'outils no-code/low-code.",
  },
  {
    sector: "Cabinet de conseil",
    icon: "📊",
    brief: "Cabinet de conseil en transformation digitale, 30 consultants. Je veux que mes équipes reçoivent chaque lundi : les nouvelles réglementations impactant nos clients (RGPD, IA Act, CSRD), les rapports McKinsey/BCG/Gartner récents, les tendances en IA générative appliquée à l'entreprise, et les mouvements stratégiques des Big Four et cabinets concurrents.",
  },
  {
    sector: "Immobilier & Construction",
    icon: "🏗️",
    brief: "Promoteur immobilier spécialisé dans le logement neuf en Île-de-France. Je veux suivre : les évolutions du PLU et des permis de construire, les prix du foncier et tendances du marché, les nouvelles normes RE2020 et leur impact sur les coûts, les projets de transport (Grand Paris) qui créent des opportunités, et les appels d'offres publics.",
  },
  {
    sector: "E-commerce & Retail",
    icon: "🛒",
    brief: "Marque DTC de compléments alimentaires, vente en ligne + marketplace. Je veux suivre : les changements réglementaires sur les compléments alimentaires en Europe (DGCCRF, EFSA), les tendances de consommation santé/bien-être, les stratégies d'acquisition des marques concurrentes sur Meta/Google, et les évolutions des algorithmes Amazon/marketplace.",
  },
];

const defaultTopics = [
  { id: "ai", label: "Intelligence artificielle", enabled: true },
  { id: "reg", label: "Réglementation & conformité", enabled: true },
  { id: "market", label: "Concurrents & marché", enabled: false },
  { id: "cyber", label: "Cybersécurité", enabled: true },
  { id: "innov", label: "Innovation & tendances", enabled: true },
  { id: "finance", label: "Finance & investissement", enabled: false },
  { id: "rh", label: "RH & management", enabled: false },
  { id: "green", label: "Développement durable", enabled: false },
];

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [showExamples, setShowExamples] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);
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
          setSendDay(cfg.send_day);
        }
        if (cfg.send_hour !== undefined && cfg.send_hour !== null) {
          setSendHour(cfg.send_hour);
        }
        if (cfg.custom_brief) {
          setCustomBrief(cfg.custom_brief);
        }
      }

      if (recipientsResult.data) {
        setRecipients(recipientsResult.data);
      }

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
    const { error } = await upsertNewsletterConfig(user.id, {
      topics, sources, frequency, custom_brief: customBrief,
      send_day: sendDay, send_hour: sendHour,
    });
    setSaving(false);
    if (error) {
      setSaveError("Erreur lors de la sauvegarde. Veuillez réessayer.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const handleAddRecipient = async () => {
    if (!user || !newName.trim() || !newEmail.trim()) return;

    const maxR = limits.maxRecipients;
    if (maxR !== -1 && recipients.length >= maxR) {
      setRecipientLimitMsg(
        plan === "free"
          ? `Limite de ${maxR} destinataire atteinte. Passez au plan Pro pour en ajouter jusqu'à 10.`
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

  const frequencyLocked = !limits.frequency.includes("weekly");
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
              Décrivez votre activité et ce que vous voulez surveiller. Plus vous êtes précis, plus votre newsletter sera pertinente et utile pour vos équipes.
            </p>

            {/* Examples section */}
            <>
              {customBrief.length <= 20 || showExamples ? (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", margin: 0 }}>
                        Besoin d&apos;inspiration ?
                      </p>
                      {customBrief.length > 20 && showExamples && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowExamples(false); }}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 12,
                            color: "var(--text-muted)",
                            padding: 0,
                            textDecoration: "underline",
                          }}
                        >
                          Masquer
                        </button>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {BRIEF_EXAMPLES.map((example) => (
                        <button
                          key={example.sector}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomBrief(example.brief);
                            setShowExamples(false);
                          }}
                          style={{
                            background: "var(--surface-alt)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            padding: "12px 16px",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "border-color 0.15s ease",
                          }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)")}
                        >
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                            {example.icon} {example.sector}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: 12 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowExamples(true); }}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        color: "var(--text-muted)",
                        padding: 0,
                        textDecoration: "underline",
                      }}
                    >
                      Voir des exemples
                    </button>
                  </div>
                )}

                {/* Structured guide */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>
                    Pour un brief efficace, précisez :
                  </p>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                    <li>🏢 Votre activité (que fait votre entreprise ?)</li>
                    <li>🎯 Ce que vous surveillez (réglementation, concurrents, tendances...)</li>
                    <li>🏭 Vos concurrents (noms précis si possible)</li>
                    <li>👥 Qui lit la newsletter (direction, technique, commercial...)</li>
                  </ul>
                </div>
            </>

            <textarea
              className="input-field"
              value={customBrief}
              onChange={(e) => setCustomBrief(e.target.value.slice(0, 1000))}
              placeholder="Ex : Je veux suivre les changements de réglementation autour des listes INCI en cosmétique, les nouvelles normes EU, les innovations en formulation clean beauty, et les lancements produits de nos concurrents (L'Oréal, Estée Lauder, Caudalie)."
              style={{ width: "100%", minHeight: 120, resize: "vertical", boxSizing: "border-box" }}
            />
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
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
                Ou sélectionnez parmi nos sources vérifiées
              </p>
              {Object.entries(CURATED_SOURCES).map(([category, items]) => (
                <div key={category} style={{ marginBottom: 16 }}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 8,
                    }}
                  >
                    {category}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {items.map((source) => {
                      const selected = sources.includes(source);
                      return (
                        <button
                          key={source}
                          onClick={() => !selected && addCuratedSource(source)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            cursor: selected ? "default" : "pointer",
                            border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                            background: selected ? "var(--accent)" : "var(--surface-alt)",
                            color: selected ? "white" : "var(--text-secondary)",
                            transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
                          }}
                        >
                          {source}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
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
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 140px" }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                  Fréquence
                  {frequencyLocked && <CrownBadge tooltip="Hebdomadaire disponible avec le plan Pro" />}
                </label>
                <select
                  className="select-field"
                  value={frequency}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFrequency(val);
                    if (val === "monthly") setSendDay("1st");
                    if (val === "weekly") setSendDay("monday");
                  }}
                >
                  <option value="monthly">Mensuel</option>
                  {limits.frequency.includes("weekly") && (
                    <option value="weekly">Hebdomadaire</option>
                  )}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 140px" }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>Jour</label>
                <select
                  className="select-field"
                  value={sendDay}
                  onChange={(e) => setSendDay(e.target.value)}
                >
                  {frequency === "weekly" ? (
                    <>
                      <option value="monday">Lundi</option>
                      <option value="tuesday">Mardi</option>
                      <option value="wednesday">Mercredi</option>
                      <option value="thursday">Jeudi</option>
                      <option value="friday">Vendredi</option>
                      <option value="saturday">Samedi</option>
                      <option value="sunday">Dimanche</option>
                    </>
                  ) : (
                    <>
                      <option value="1st">1er du mois</option>
                      <option value="15th">15 du mois</option>
                    </>
                  )}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 100px" }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>Heure</label>
                <select
                  className="select-field"
                  value={sendHour}
                  onChange={(e) => setSendHour(Number(e.target.value))}
                >
                  {Array.from({ length: 16 }, (_, i) => i + 6).map((h) => (
                    <option key={h} value={h}>{h}h00</option>
                  ))}
                </select>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 14, marginBottom: 0 }}>
              {frequency === "weekly"
                ? `Votre newsletter sera envoyée chaque ${
                    { monday: "lundi", tuesday: "mardi", wednesday: "mercredi", thursday: "jeudi", friday: "vendredi", saturday: "samedi", sunday: "dimanche" }[sendDay] ?? sendDay
                  } à ${sendHour}h00`
                : `Votre newsletter sera envoyée le ${sendDay === "1st" ? "1er" : "15"} de chaque mois à ${sendHour}h00`}
            </p>
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
            {saving ? "Sauvegarde..." : saved ? "✓ Sauvegardé !" : "Sauvegarder les modifications"}
          </button>
        </>
      )}
    </div>
  );
}
