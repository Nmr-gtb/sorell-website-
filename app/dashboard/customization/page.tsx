// NOTE: Run in Supabase SQL Editor BEFORE using this page:
// ALTER TABLE public.newsletter_config ADD COLUMN IF NOT EXISTS brand_color text DEFAULT '#2563EB';
// ALTER TABLE public.newsletter_config ADD COLUMN IF NOT EXISTS custom_logo_url text DEFAULT NULL;

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
  { label: "Bleu Sorell", value: "#2563EB" },
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

  const [brandColor, setBrandColor] = useState("#2563EB");
  const [hexInput, setHexInput] = useState("#2563EB");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [realPlan, setRealPlan] = useState("free");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const plan = getEffectivePlan(realPlan);
  const isPro = plan === "pro" || plan === "enterprise";

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
      .select("brand_color, custom_logo_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.brand_color) {
          setBrandColor(data.brand_color);
          setHexInput(data.brand_color);
        }
        if (data?.custom_logo_url) setLogoUrl(data.custom_logo_url);
      });
  }, [user]);

  const handleColorSelect = (color: string) => {
    setBrandColor(color);
    setHexInput(color);
  };

  const handleHexInput = (val: string) => {
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setBrandColor(val);
    }
  };

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

    // Supprimer l'ancien logo s'il existe
    await supabase.storage.from("logos").remove([`${user.id}/logo.png`, `${user.id}/logo.svg`, `${user.id}/logo.jpg`, `${user.id}/logo.jpeg`]);

    const { error } = await supabase.storage
      .from("logos")
      .upload(filePath, logoFile, { upsert: true });

    setUploading(false);

    if (error) {
      console.error("Upload error:", error);
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
      .update({ brand_color: brandColor, custom_logo_url: finalLogoUrl || null })
      .eq("user_id", user.id);

    setSaving(false);
    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  if (!isPro) {
    return (
      <div style={{ padding: "40px 32px" }}>
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="1.5"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              marginTop: 16,
              color: "var(--text)",
            }}
          >
            {t("custom.locked_title")}
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              marginTop: 8,
              maxWidth: 400,
              margin: "8px auto 0",
            }}
          >
            {t("custom.locked_desc")}
          </p>
          <a
            href="/tarifs"
            style={{
              display: "inline-block",
              marginTop: 20,
              padding: "10px 24px",
              background: "var(--accent)",
              color: "white",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {t("custom.upgrade")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 32px", maxWidth: 680 }}>
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

      {/* Section couleur */}
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
          Choisissez la couleur principale de votre newsletter. Elle sera
          utilisée pour les accents, les titres de sections et les boutons.
        </p>

        {/* Swatches */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => handleColorSelect(c.value)}
              title={c.label}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: c.value,
                border:
                  brandColor === c.value
                    ? `3px solid ${c.value}`
                    : "3px solid transparent",
                outline:
                  brandColor === c.value ? `2px solid ${c.value}` : "none",
                outlineOffset: 2,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  brandColor === c.value
                    ? "0 0 0 2px white, 0 0 0 4px " + c.value
                    : "0 1px 3px rgba(0,0,0,0.15)",
                transition: "box-shadow 0.15s ease",
                flexShrink: 0,
              }}
            >
              {brandColor === c.value && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* HEX input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            Ou entrez un code couleur :
          </label>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: brandColor,
              border: "1px solid var(--border)",
              flexShrink: 0,
            }}
          />
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexInput(e.target.value)}
            placeholder="#2563EB"
            style={{
              fontSize: 13,
              padding: "6px 10px",
              border: "1px solid var(--border)",
              borderRadius: 6,
              background: "var(--surface-alt)",
              color: "var(--text)",
              width: 110,
              fontFamily: "monospace",
            }}
          />
        </div>

        {/* Preview */}
        <div
          style={{
            marginTop: 20,
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: `2px solid ${brandColor}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#fff",
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#111827",
                letterSpacing: "-0.02em",
              }}
            >
              Sorel
              <span style={{ color: brandColor }}>l</span>
            </span>
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>Aperçu</span>
          </div>
          <div style={{ padding: "12px 16px", background: "#F9FAFB" }}>
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 4,
                background: brandColor,
                color: "white",
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Article phare
            </span>
            <p
              style={{
                fontSize: 13,
                color: "#111827",
                fontWeight: 600,
                margin: "8px 0 4px",
              }}
            >
              Titre de l&apos;article principal
            </p>
            <a
              href="#"
              style={{
                fontSize: 12,
                color: brandColor,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Lire l&apos;article →
            </a>
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
          {t("custom.logo_desc")} Format recommandé : PNG ou SVG, fond
          transparent, max 200x60px.
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
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginTop: 8,
            }}
          >
            Sans logo, le texte &quot;Sorell&quot; sera utilisé par défaut.
          </p>
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
          {uploading ? "Upload en cours..." : saving ? "Sauvegarde..." : t("custom.save")}
        </button>
        {saveSuccess && (
          <span
            style={{
              fontSize: 13,
              color: "#059669",
              fontWeight: 500,
            }}
          >
            ✓ {t("custom.saved")}
          </span>
        )}
      </div>
    </div>
  );
}
