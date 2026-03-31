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
          Personnalisation
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
          Personnalisez les couleurs et le logo de vos newsletters.
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
            Disponible avec le plan Pro
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
            Changez les couleurs de vos newsletters avec le plan Pro (19€/mois).<br/>
            Ajoutez votre logo avec le plan Business (49€/mois).
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
            Voir les plans →
          </a>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>
            15 jours d&apos;essai gratuit, sans engagement.
          </p>
        </div>
      </div>
    );
  }

  const customLogo = canUseLogo ? logoUrl : null;

  return (
    <div style={{ padding: "40px 32px", maxWidth: 720 }}>
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
          Personnalisez les couleurs de votre newsletter.
        </p>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {/* Card Couleur dominante */}
          <div style={{ flex: "1 1 200px", padding: 16, background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px", color: "var(--text)" }}>Couleur dominante</p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px" }}>Accents, liens, boutons</p>

            {/* Swatches */}
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

          {/* Card Couleur des titres */}
          <div style={{ flex: "1 1 200px", padding: 16, background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px", color: "var(--text)" }}>Couleur des titres</p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px" }}>Titres d&apos;articles et sujet</p>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 40 }}>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                style={{ width: 40, height: 40, border: "none", cursor: "pointer", borderRadius: 8, padding: 2, flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 3 }}>Code HEX</label>
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setTextColor(val);
                  }}
                  placeholder="#111827"
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

          {/* Card Couleur de fond */}
          <div style={{ flex: "1 1 200px", padding: 16, background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px", color: "var(--text)" }}>Couleur de fond</p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px" }}>Arrière-plan de la newsletter</p>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 40 }}>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                style={{ width: 40, height: 40, border: "none", cursor: "pointer", borderRadius: 8, padding: 2, flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 3 }}>Code HEX</label>
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setBgColor(val);
                  }}
                  placeholder="#FFFFFF"
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

          {/* Card Couleur des textes */}
          <div style={{ flex: "1 1 200px", padding: 16, background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px", color: "var(--text)" }}>Couleur des textes</p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px" }}>Contenu, accroches, sources</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 40 }}>
              <input
                type="color"
                value={bodyTextColor}
                onChange={(e) => setBodyTextColor(e.target.value)}
                style={{ width: 40, height: 40, border: "none", cursor: "pointer", borderRadius: 8, padding: 2, flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginBottom: 3 }}>Code HEX</label>
                <input
                  type="text"
                  value={bodyTextColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setBodyTextColor(val);
                  }}
                  placeholder="#4B5563"
                  style={{ width: "100%", padding: "5px 8px", fontSize: 13, borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface-alt)", color: "var(--text)", fontFamily: "monospace", boxSizing: "border-box" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section logo */}
      <div
        style={{
          background: "var(--surface)",
          border: canUseLogo ? "1px solid var(--border)" : "1px solid var(--border)",
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
          {t("custom.logo_title")}
        </p>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            margin: "0 0 20px",
            lineHeight: 1.5,
          }}
        >
          {t("custom.logo_desc")} Format recommandé : PNG ou SVG, fond transparent, max 200x60px.
        </p>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleLogoDrop}
          style={{
            border: "2px dashed var(--border)",
            borderRadius: 10,
            padding: "32px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: "var(--surface)",
            transition: "border-color 0.2s",
          }}
          onClick={() => document.getElementById("logo-input")?.click()}
        >
          {logoPreview || logoUrl ? (
            <div>
              <img
                src={logoPreview || logoUrl}
                alt="Logo"
                style={{ maxHeight: 50, maxWidth: 200, marginBottom: 12 }}
              />
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "8px 0 0" }}>
                Cliquez ou glissez pour remplacer
              </p>
            </div>
          ) : (
            <div>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: 8 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "4px 0" }}>
                Glissez votre logo ici ou cliquez pour sélectionner
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                PNG, SVG ou JPG - max 200x60px recommandé
              </p>
            </div>
          )}
          <input
            id="logo-input"
            type="file"
            accept="image/png,image/svg+xml,image/jpeg"
            style={{ display: "none" }}
            onChange={handleLogoSelect}
          />
        </div>

        {(logoUrl || logoPreview) && (
          <button
            onClick={() => {
              setLogoUrl("");
              setLogoPreview(null);
              setLogoFile(null);
            }}
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "#EF4444",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Supprimer le logo
          </button>
        )}

        {!logoUrl && !logoPreview && (
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
            Sans logo, le texte &quot;Sorell&quot; sera utilisé par défaut.
          </p>
        )}
      </div>

      {/* Preview */}
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
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
            margin: "0 0 16px",
          }}
        >
          Aperçu
        </p>
        <div style={{ maxWidth: 500, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "16px 20px", borderBottom: `2px solid ${brandColor}`, background: bgColor, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {customLogo ? (
              <img src={logoPreview || customLogo} alt="Logo" style={{ maxHeight: 28, maxWidth: 140 }} />
            ) : (
              <span style={{ fontSize: 16, fontWeight: 700, color: textColor }}>Sorel<span style={{ color: brandColor }}>l</span></span>
            )}
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>20 mars 2026</span>
          </div>
          {/* Subject */}
          <div style={{ padding: "16px 20px 12px", background: bgColor }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: textColor, margin: 0 }}>Titre de votre newsletter</h3>
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: "4px 0 0" }}>Votre veille sectorielle personnalisée</p>
          </div>
          {/* Article phare */}
          <div style={{ padding: "0 20px 16px", background: bgColor }}>
            <div style={{ background: `${brandColor}11`, borderRadius: 8, padding: 16, border: `1px solid ${brandColor}33` }}>
              <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, background: brandColor, color: "white", fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>Article phare</span>
              <p style={{ fontSize: 14, fontWeight: 600, color: textColor, margin: "8px 0 4px" }}>Un exemple d&apos;article mis en avant</p>
              <p style={{ fontSize: 12, color: bodyTextColor, fontStyle: "italic", margin: "0 0 6px" }}>Accroche de l&apos;article en gris italique</p>
              <p style={{ fontSize: 12, color: bodyTextColor, margin: 0 }}>Contenu de l&apos;article avec des détails concrets...</p>
            </div>
          </div>
          {/* Article normal */}
          <div style={{ padding: "0 20px 16px", background: bgColor }}>
            <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 12 }}>
              <span style={{ display: "inline-block", padding: "2px 6px", borderRadius: 4, background: "#F3F4F6", color: "#374151", fontSize: 9, fontWeight: 600, textTransform: "uppercase" }}>Catégorie</span>
              <p style={{ fontSize: 13, fontWeight: 600, color: textColor, margin: "6px 0 4px" }}>Un autre article de la semaine</p>
              <a style={{ fontSize: 11, color: brandColor, textDecoration: "none" }}>Lire l&apos;article</a>
            </div>
          </div>
          {/* Footer */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB" }}>
            {customLogo ? (
              <img src={logoPreview || customLogo} alt="Logo" style={{ maxHeight: 20, maxWidth: 100 }} />
            ) : (
              <span style={{ fontSize: 12, fontWeight: 700, color: textColor }}>Sorel<span style={{ color: brandColor }}>l</span></span>
            )}
          </div>
        </div>
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
          {uploading ? "Upload en cours..." : saving ? "Sauvegarde..." : t("custom.save")}
        </button>
        {saveSuccess && (
          <span style={{ fontSize: 13, color: "#059669", fontWeight: 500 }}>
            ✓ {t("custom.saved")}
          </span>
        )}
      </div>
    </div>
  );
}
