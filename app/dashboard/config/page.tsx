"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  getNewsletterConfig,
  upsertNewsletterConfig,
  getRecipients,
  addRecipient,
  deleteRecipient,
} from "@/lib/database";

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
  const [frequency, setFrequency] = useState("weekly-1");
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("");
  const [addingRecipient, setAddingRecipient] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      setLoading(true);
      const [configResult, recipientsResult] = await Promise.all([
        getNewsletterConfig(user!.id),
        getRecipients(user!.id),
      ]);

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
      }

      if (recipientsResult.data) {
        setRecipients(recipientsResult.data);
      }

      setLoading(false);
    }

    loadData();
  }, [user]);

  const toggleTopic = (id: string) => {
    setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
  };

  const addSource = () => {
    const trimmed = newSource.trim();
    if (trimmed && !sources.includes(trimmed)) {
      setSources((prev) => [...prev, trimmed]);
      setNewSource("");
    }
  };

  const removeSource = (s: string) => setSources((prev) => prev.filter((x) => x !== s));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError("");
    const { error } = await upsertNewsletterConfig(user.id, { topics, sources, frequency });
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
    }
  };

  const handleDeleteRecipient = async (id: string) => {
    const { error } = await deleteRecipient(id);
    if (!error) {
      setRecipients((prev) => prev.filter((r) => r.id !== id));
    }
  };

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
                    <Toggle enabled={topic.enabled} onChange={() => toggleTopic(topic.id)} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                className="btn-ghost"
                disabled
                style={{ fontSize: 13, padding: "6px 14px", opacity: 0.5, cursor: "not-allowed" }}
              >
                + Ajouter une thématique
              </button>
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
          </div>

          {/* Frequency card */}
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
              Fréquence d&apos;envoi
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { value: "weekly-1", label: "1 fois par semaine (lundi 9h)" },
                { value: "weekly-2", label: "2 fois par semaine (lundi + jeudi 9h)" },
                { value: "daily", label: "Quotidien (tous les matins 8h)" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    fontSize: 14,
                    color: "var(--text)",
                  }}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={opt.value}
                    checked={frequency === opt.value}
                    onChange={() => setFrequency(opt.value)}
                    style={{ accentColor: "var(--accent)", width: 16, height: 16, cursor: "pointer" }}
                  />
                  {opt.label}
                </label>
              ))}
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
              Destinataires
            </h2>
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
                  onClick={() => setShowAddForm(true)}
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
