// NOTE: Run in Supabase SQL Editor BEFORE using this page:
// ALTER TABLE public.newsletter_config ADD COLUMN IF NOT EXISTS brand_color text DEFAULT '#005058';
// ALTER TABLE public.newsletter_config ADD COLUMN IF NOT EXISTS custom_logo_url text DEFAULT NULL;
// ALTER TABLE public.newsletter_config ADD COLUMN IF NOT EXISTS text_color text DEFAULT '#111827';
// ALTER TABLE public.newsletter_config ADD COLUMN IF NOT EXISTS bg_color text DEFAULT '#FFFFFF';
// ALTER TABLE public.newsletter_config ADD COLUMN IF NOT EXISTS body_text_color text DEFAULT '#4B5563';

// NOTE: Dans Supabase -> Storage -> logos -> Policies, ajouter :
// INSERT policy : authenticated users can upload to their own folder (storage.foldername(name))[1] = auth.uid()
// SELECT policy : public access (pour que les logos soient visibles dans les emails)
// DELETE policy : authenticated users can delete their own files

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useDevMode } from "@/lib/DevModeContext";
import { useLanguage } from "@/lib/LanguageContext";

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

export default function CustomizationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const { getEffectivePlan } = useDevMode();

  const [brandColor, setBrandColor] = useState("#005058");
  const [textColor, setTextColor] = useState("#111827");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [bodyTextColor, setBodyTextColor] = useState("#4B5563");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [realPlan, setRealPlan] = useState("free");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const plan = getEffectivePlan(realPlan);
  const isPro = plan === "pro" || plan === "business" || plan === "enterprise";
  const canUseLogo = plan === "business" || plan === "enterprise";

  useEffect(() => {
    if (!user) return;

    supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setRealPlan(data?.plan || "free");
      });

    supabase
      .from("newsletter_config")
      .select("brand_color, custom_logo_url, text_color, bg_color, body_text_color")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.brand_color) setBrandColor(data.brand_color);
        if (data?.custom_logo_url) setLogoUrl(data.custom_logo_url);
        if (data?.text_color) setTextColor(data.text_color);
        if (data?.bg_color) setBgColor(data.bg_color);
        if (data?.body_text_color) setBodyTextColor(data.body_text_color);
      });
  }, [user]);

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

    const { error } = await supabase.storage
      .from("logos")
      .upload(filePath, logoFile, { upsert: true });

    setUploading(false);

    if (error) {
      return null;
    }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    let finalLogoUrl = logoUrl;

    if (logoFile) {
      const uploadedUrl = await uploadLogo();
      if (uploadedUrl) {
        finalLogoUrl = uploadedUrl;
        setLogoUrl(uploadedUrl);
        setLogoFile(null);
      }
    }

    const { error } = await supabase
      .from("newsletter_config")
      .update({
        brand_color: brandColor,
        custom_logo_url: finalLogoUrl || null,
        text_color: textColor,
        bg_color: bgColor,
        body_text_color: bodyTextColor,
      })
      .eq("user_id", user.id);

    setSaving(false);
    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  if (!isPro) {
    return (
      <div style={{ padding: 32, maxWidth: 600 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
          {t("custom.title")}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
          {t("custom.subtitle")}
        </p>

        <div style={{
          padding: 24,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎨</div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
            {t("custom.pro_required")}
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
            {t("custom.pro_desc")}
          </p>
          <a href="/tarifs" style={{
            display: "inline-block",
            padding: "10px 24px",
            background: "var(--accent)",
            color: "white",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}>
            {t("custom.see_plans")}
          </a>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>
            15 jours d&apos;essai gratuit, sans engagement.
          </p>
        </div>
      </div>
    );
  }

  const customLogo = canUseLogo ? logoUrl : null;
  const previewLogo = canUseLogo ? (logoPreview || customLogo) : null;
  const warmBorder = "#E8E0D8";
  const warmBg = "#F5F0EB";
  const secondaryText = "#7A7267";
  const previewDate = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ padding: "40px 32px" }}>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--text)",
          margin: "0 0 32px",
          letterSpacing: "-0.02em",
        }}
      >
        {t("custom.title")}
      </h1>

      {/* 2-column layout: controls left, preview right */}
      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>

        {/* LEFT COLUMN — Controls */}
        <div style={{ flex: "0 0 400px", minWidth: 0 }}>

          {/* Section couleurs */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                margin: "0 0 6px",
              }}
            >
              {t("custom.color_title")}
            </p>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                margin: "0 0 20px",
                lineHeight: 1.5,
              }}
            >
              {t("custom.colors_desc")}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Couleur dominante */}
              <div style={{ padding: 16, background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px", color: "var(--text)" }}>{t("custom.primary_color")}</p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px" }}>{t("custom.primary_desc")}</p>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setBrandColor(c.value)}
                      title={c.label}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: c.value,
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow:
                          brandColor === c.value
                            ? "0 0 0 2px white, 0 0 0 4px " + c.value
                            : "0 1px 3px rgba(0,0,0,0.15)",
                        flexShrink: 0,
                        padding: 0,
                      }}
                    >
                      {brandColor === c.value && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    style={{ width: 40, height: 40, border: "none", cursor: "pointer", borderRadius: 8, padding: 2, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 3 }}>Code HEX</label>
                    <input
                      type="text"
                      value={brandColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setBrandColor(val);
                      }}
                      placeholder="#005058"
                      style={{
                        width: "100%",
                        padding: "5px 8px",
                        fontSize: 13,
                        borderRadius: 6,
                        border: "1px solid var(--border)",
                        background: "var(--surface-alt)",
                        color: "var(--text)",
                        fontFamily: "monospace",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Couleurs secondaires en grille 2x1 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* Couleur des titres */}
                <div style={{ padding: 14, background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 3px", color: "var(--text)" }}>{t("custom.title_color")}</p>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 10px" }}>{t("custom.title_desc")}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                      style={{ width: 32, height: 32, border: "none", cursor: "pointer", borderRadius: 6, padding: 2, flexShrink: 0 }} />
                    <input type="text" value={textColor}
                      onChange={(e) => { const val = e.target.value; if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setTextColor(val); }}
                      placeholder="#111827"
                      style={{ width: "100%", padding: "4px 6px", fontSize: 12, borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface-alt)", color: "var(--text)", fontFamily: "monospace", boxSizing: "border-box" }} />
                  </div>
                </div>

                {/* Couleur de fond */}
                <div style={{ padding: 14, background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 3px", color: "var(--text)" }}>{t("custom.bg_color")}</p>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 10px" }}>{t("custom.bg_desc")}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                      style={{ width: 32, height: 32, border: "none", cursor: "pointer", borderRadius: 6, padding: 2, flexShrink: 0 }} />
                    <input type="text" value={bgColor}
                      onChange={(e) => { const val = e.target.value; if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setBgColor(val); }}
                      placeholder="#FFFFFF"
                      style={{ width: "100%", padding: "4px 6px", fontSize: 12, borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface-alt)", color: "var(--text)", fontFamily: "monospace", boxSizing: "border-box" }} />
                  </div>
                </div>
              </div>

              {/* Couleur des textes */}
              <div style={{ padding: 14, background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 3px", color: "var(--text)" }}>{t("custom.text_color")}</p>
                <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 10px" }}>{t("custom.text_desc")}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="color" value={bodyTextColor} onChange={(e) => setBodyTextColor(e.target.value)}
                    style={{ width: 32, height: 32, border: "none", cursor: "pointer", borderRadius: 6, padding: 2, flexShrink: 0 }} />
                  <input type="text" value={bodyTextColor}
                    onChange={(e) => { const val = e.target.value; if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setBodyTextColor(val); }}
                    placeholder="#4B5563"
                    style={{ width: "100%", padding: "4px 6px", fontSize: 12, borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface-alt)", color: "var(--text)", fontFamily: "monospace", boxSizing: "border-box" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Section logo */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
              opacity: canUseLogo ? 1 : 0.5,
              pointerEvents: canUseLogo ? "auto" : "none",
              position: "relative",
            }}
          >
            {!canUseLogo && (
              <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 6, background: "var(--surface-alt)", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#EAB308" stroke="#EAB308" strokeWidth="1.5"><path d="M2 20h20L19 9l-5 4-2-6-2 6-5-4z"/></svg>
                Business
              </div>
            )}
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>
              {t("custom.logo_title")}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.5 }}>
              {t("custom.logo_desc")} {t("custom.logo_format")}
            </p>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleLogoDrop}
              style={{
                border: "2px dashed var(--border)",
                borderRadius: 10,
                padding: "24px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: "var(--surface)",
                transition: "border-color 0.2s",
              }}
              onClick={() => document.getElementById("logo-input")?.click()}
            >
              {logoPreview || logoUrl ? (
                <div>
                  <img src={logoPreview || logoUrl} alt="Logo" style={{ maxHeight: 50, maxWidth: 200, marginBottom: 12 }} />
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "8px 0 0" }}>{t("custom.logo_replace")}</p>
                </div>
              ) : (
                <div>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: 8 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "4px 0" }}>{t("custom.logo_drop")}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{t("custom.logo_formats")}</p>
                </div>
              )}
              <input id="logo-input" type="file" accept="image/png,image/svg+xml,image/jpeg" style={{ display: "none" }} onChange={handleLogoSelect} />
            </div>

            {(logoUrl || logoPreview) && (
              <button
                onClick={() => { setLogoUrl(""); setLogoPreview(null); setLogoFile(null); }}
                style={{ marginTop: 8, fontSize: 13, color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {t("custom.logo_delete")}
              </button>
            )}

            {!logoUrl && !logoPreview && (
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>{t("custom.logo_default")}</p>
            )}
          </div>

          {/* Save button */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              style={{
                padding: "10px 24px",
                background: "var(--accent)",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: saving || uploading ? "not-allowed" : "pointer",
                opacity: saving || uploading ? 0.7 : 1,
              }}
            >
              {uploading ? t("custom.uploading") : saving ? t("custom.saving") : t("custom.save")}
            </button>
            {saveSuccess && (
              <span style={{ fontSize: 13, color: "#059669", fontWeight: 500 }}>
                ✓ {t("custom.saved")}
              </span>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — Live V4 email preview */}
        <div style={{ flex: 1, minWidth: 0, position: "sticky", top: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: "0 0 12px" }}>
            {t("custom.preview")}
          </p>
          <div style={{ background: warmBg, borderRadius: 12, padding: 20, border: "1px solid var(--border)" }}>
            <div style={{ maxWidth: 560, margin: "0 auto", background: bgColor, borderRadius: 4, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>

              {/* Header */}
              <div style={{ padding: "16px 24px", borderBottom: `1px solid ${warmBorder}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {previewLogo ? (
                    <img src={previewLogo} alt="Logo" style={{ maxHeight: 28, maxWidth: 140 }} />
                  ) : (
                    <img src="/icone.png" alt="S." style={{ width: 28, height: 28 }} />
                  )}
                  <span style={{ fontSize: 11, color: secondaryText, fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    Semaine du {previewDate}
                  </span>
                </div>
              </div>

              {/* Hero */}
              <div style={{ background: brandColor, display: "flex" }}>
                <div style={{ padding: "28px 24px 24px", flex: "0 0 65%" }}>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px", fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
                    Semaine du {previewDate} · Sorell
                  </p>
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF", margin: 0, lineHeight: 1.3, fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "-0.01em" }}>
                    Sorell automatise votre veille sectorielle chaque semaine
                  </h1>
                </div>
                <div style={{ flex: "0 0 35%", display: "flex", alignItems: "flex-end" }}>
                  <div style={{ height: 100, width: "100%", background: "rgba(255,255,255,0.08)", borderRadius: "8px 0 0 0" }}></div>
                </div>
              </div>

              {/* Article phare */}
              <div style={{ padding: "20px 24px 18px" }}>
                <div style={{ marginBottom: 10, display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 4, background: brandColor, color: "white", fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    A la une
                  </span>
                  <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 4, background: warmBg, color: secondaryText, fontSize: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Veille IA
                  </span>
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: textColor, margin: "0 0 8px", lineHeight: 1.35, fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  Sorell automatise votre veille sectorielle chaque semaine
                </h2>
                <p style={{ fontSize: 12, color: secondaryText, margin: "0 0 10px", fontStyle: "italic", lineHeight: 1.5, fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  Plus besoin de faire votre veille. Sorell l&apos;a d&eacute;j&agrave; faite.
                </p>
                <p style={{ fontSize: 12, color: bodyTextColor, lineHeight: 1.65, margin: "0 0 14px" }}>
                  Sorell analyse plus de 147 sources en temps r&eacute;el et g&eacute;n&egrave;re une newsletter personnalis&eacute;e pour votre secteur en 12 secondes. Vos &eacute;quipes re&ccedil;oivent l&apos;essentiel, sans effort.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ display: "inline-block", padding: "8px 18px", background: brandColor, color: "white", fontSize: 11, fontWeight: 600, borderRadius: 6 }}>
                    D&eacute;couvrir Sorell →
                  </span>
                  <span style={{ fontSize: 10, color: secondaryText }}>sorell.fr</span>
                </div>
              </div>
              <div style={{ padding: "0 24px" }}><div style={{ borderTop: `1px solid ${warmBorder}` }}></div></div>

              {/* Editorial */}
              <div style={{ padding: "18px 24px" }}>
                <div style={{ borderLeft: `3px solid ${brandColor}`, padding: "14px 18px", background: warmBg, borderRadius: "0 8px 8px 0" }}>
                  <p style={{ fontSize: 9, fontWeight: 600, color: brandColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
                    Le point de vue
                  </p>
                  <p style={{ fontSize: 12, color: bodyTextColor, lineHeight: 1.65, margin: 0, fontStyle: "italic", fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    La veille sectorielle n&apos;est plus un luxe r&eacute;serv&eacute; aux grandes entreprises. Avec Sorell, chaque dirigeant de PME re&ccedil;oit une synth&egrave;se claire et actionnable, directement dans sa bo&icirc;te mail.
                  </p>
                </div>
              </div>
              <div style={{ padding: "0 24px" }}><div style={{ borderTop: `1px solid ${warmBorder}` }}></div></div>

              {/* Chiffres clés */}
              <div style={{ padding: "18px 24px" }}>
                <p style={{ fontSize: 9, fontWeight: 600, color: brandColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
                  Chiffres cl&eacute;s
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { value: "147+", label: "Sources analys\u00e9es", context: "en temps r\u00e9el" },
                    { value: "12s", label: "G\u00e9n\u00e9ration", context: "par newsletter" },
                    { value: "30+", label: "Secteurs couverts", context: "et sur-mesure" },
                  ].map((fig, i) => (
                    <div key={i} style={{ flex: 1, background: warmBg, border: `1px solid ${warmBorder}`, borderRadius: 8, padding: 12, textAlign: "center" }}>
                      <p style={{ fontSize: 18, fontWeight: 700, color: brandColor, margin: "0 0 4px", fontFamily: "Georgia, 'Times New Roman', serif" }}>{fig.value}</p>
                      <p style={{ fontSize: 10, color: textColor, fontWeight: 600, margin: "0 0 2px" }}>{fig.label}</p>
                      <p style={{ fontSize: 9, color: secondaryText, margin: 0 }}>{fig.context}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: "0 24px" }}><div style={{ borderTop: `1px solid ${warmBorder}` }}></div></div>

              {/* Articles secondaires */}
              <div style={{ padding: "18px 24px 8px" }}>
                <p style={{ fontSize: 9, fontWeight: 600, color: brandColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>
                  A lire aussi
                </p>
                {[
                  { tag: "Fonctionnalit\u00e9", source: "Sorell", title: "Personnalisez vos newsletters avec votre identit\u00e9 visuelle", desc: "Couleurs, logo, fr\u00e9quence d'envoi : chaque newsletter Sorell est adapt\u00e9e \u00e0 votre marque." },
                  { tag: "Produit", source: "Sorell", title: "Sources custom et analytics : gardez le contr\u00f4le sur votre veille", desc: "Ajoutez vos propres sources, suivez les taux d'ouverture et de clic." },
                ].map((a, i) => (
                  <div key={i} style={{ border: `1px solid ${warmBorder}`, borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ padding: 16, background: bgColor }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, background: warmBg, color: secondaryText, fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {a.tag}
                        </span>
                        <span style={{ fontSize: 9, color: secondaryText }}>{a.source}</span>
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: textColor, margin: "0 0 6px", lineHeight: 1.35, fontFamily: "Georgia, 'Times New Roman', serif" }}>
                        {a.title}
                      </h3>
                      <p style={{ fontSize: 11, color: bodyTextColor, lineHeight: 1.6, margin: "0 0 10px" }}>{a.desc}</p>
                      <span style={{ fontSize: 10, color: brandColor, fontWeight: 600 }}>Lire la suite →</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div style={{ padding: "4px 24px 20px" }}>
                <div style={{ borderRadius: 8, overflow: "hidden", background: brandColor, display: "flex" }}>
                  <div style={{ padding: "20px 20px 20px 24px", flex: "0 0 65%" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", margin: "0 0 4px", fontFamily: "Georgia, 'Times New Roman', serif", lineHeight: 1.4 }}>
                      Essayez Sorell gratuitement
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", margin: "0 0 14px", lineHeight: 1.5 }}>
                      1 newsletter par mois, sans engagement.
                    </p>
                    <span style={{ display: "inline-block", padding: "8px 18px", background: "white", color: brandColor, fontSize: 11, fontWeight: 600, borderRadius: 6 }}>
                      Commencer →
                    </span>
                  </div>
                  <div style={{ flex: "0 0 35%", display: "flex", alignItems: "flex-end" }}>
                    <div style={{ height: 90, width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: "8px 0 0 0" }}></div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: "16px 24px", borderTop: `1px solid ${warmBorder}`, background: warmBg }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  {previewLogo ? (
                    <img src={previewLogo} alt="Logo" style={{ maxHeight: 20, maxWidth: 100 }} />
                  ) : (
                    <img src="/icone.png" alt="S." style={{ width: 20, height: 20 }} />
                  )}
                  <span style={{ fontSize: 10, color: brandColor }}>sorell.fr</span>
                </div>
                <p style={{ fontSize: 9, color: secondaryText, margin: 0, lineHeight: 1.5 }}>
                  G&eacute;n&eacute;r&eacute; par Sorell · Votre veille sectorielle par IA
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
