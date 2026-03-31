"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getProfile, updateProfile } from "@/lib/database";
import { supabase } from "@/lib/supabase";
import { authFetch } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

function getInitials(user: { user_metadata?: { full_name?: string }; email?: string }) {
  const name = user.user_metadata?.full_name;
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  return (user.email?.[0] ?? "?").toUpperCase();
}

function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [newsletter, setNewsletter] = useState(true);
  const [plan, setPlan] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  // Edit name states
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Delete account states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const upgraded = searchParams.get("upgraded") === "true";

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then(({ data }) => {
      if (data?.plan) setPlan(data.plan);
      setLoadingProfile(false);
    });
  }, [user]);

  const handlePortal = async () => {
    if (!user) return;
    setPortalLoading(true);
    const res = await authFetch("/api/portal", {
      method: "POST",
      body: JSON.stringify({ userId: user.id }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setPortalLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!user || !editName.trim()) return;
    setSaving(true);

    const { error } = await updateProfile(user.id, { full_name: editName.trim() });
    await supabase.auth.updateUser({ data: { full_name: editName.trim() } });

    if (!error) {
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "SUPPRIMER" || !user) return;
    setDeleting(true);

    const res = await authFetch("/api/delete-account", {
      method: "POST",
      body: JSON.stringify({ userId: user.id }),
    });

    if (res.ok) {
      await signOut();
      router.push("/");
    } else {
      setDeleteError(t("profile.delete_error"));
      setDeleting(false);
    }
  };

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.email || "";
  const joinDate = new Date(user.created_at).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const planLabel = plan ? capitalize(plan) : "Free";

  const planDescriptionKeys: Record<string, string> = {
    free: "profile.plan_desc_free",
    pro: "profile.plan_desc_pro",
    business: "profile.plan_desc_business",
    enterprise: "profile.plan_desc_enterprise",
  };
  const planDescription = t(planDescriptionKeys[plan ?? "free"] ?? planDescriptionKeys.free);

  return (
    <div style={{ padding: 32, maxWidth: 700 }}>
      {/* Upgrade success banner */}
      {upgraded && (
        <div
          style={{
            marginBottom: 24,
            padding: "12px 16px",
            borderRadius: 8,
            background: "var(--success-bg)",
            border: "1px solid var(--success)",
            color: "var(--success)",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {t("profile.upgrade_success").replace("{plan}", planLabel)}
        </div>
      )}

      {/* Save success banner */}
      {saveSuccess && (
        <div
          style={{
            marginBottom: 24,
            padding: "12px 16px",
            borderRadius: 8,
            background: "var(--success-bg)",
            border: "1px solid var(--success)",
            color: "var(--success)",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {t("profile.name_updated")}
        </div>
      )}

      {/* Page header */}
      <h1
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: "var(--text)",
          letterSpacing: "-0.02em",
          marginBottom: 32,
        }}
      >
        {t("profile.title")}
      </h1>

      {/* Profile card */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--accent)",
              color: "var(--accent-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {getInitials(user)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayName}
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              {t("profile.member_since").replace("{date}", joinDate)}
            </div>
          </div>
          {!editing && (
            <button
              className="btn-ghost"
              onClick={() => { setEditing(true); setEditName(displayName); }}
              style={{ fontSize: 14, padding: "6px 14px" }}
            >
              {t("profile.edit")}
            </button>
          )}
        </div>
      </div>

      {/* Subscription card */}
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
          {t("profile.subscription")}
        </h2>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
                {loadingProfile ? "..." : planLabel}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 100,
                  background: "var(--accent-subtle)",
                  color: "var(--accent)",
                  border: "1px solid var(--accent-border)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {t("profile.active")}
              </span>
            </div>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              {loadingProfile ? "..." : planDescription}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {plan && plan !== "free" ? (
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="btn-ghost"
              style={{ fontSize: 14, padding: "7px 14px", opacity: portalLoading ? 0.7 : 1, cursor: portalLoading ? "wait" : "pointer" }}
            >
              {portalLoading ? t("common.loading") : t("profile.manage_subscription")}
            </button>
          ) : (
            <Link href="/tarifs" className="btn-ghost" style={{ fontSize: 14, padding: "7px 14px" }}>
              {t("profile.change_plan")}
            </Link>
          )}
        </div>
      </div>

      {/* Account settings card */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 20,
          }}
        >
          {t("profile.account_settings")}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Name field */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: 6,
              }}
            >
              {t("profile.full_name")}
            </label>
            {editing ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  className="input-field"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ flex: 1 }}
                  autoFocus
                />
                <button
                  className="btn-primary"
                  onClick={handleSaveName}
                  disabled={saving || !editName.trim()}
                  style={{ fontSize: 13, padding: "6px 14px", opacity: saving ? 0.7 : 1, cursor: saving ? "wait" : "pointer", whiteSpace: "nowrap" }}
                >
                  {saving ? "..." : t("profile.save")}
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  style={{ fontSize: 13, padding: "6px 14px", whiteSpace: "nowrap" }}
                >
                  {t("profile.cancel")}
                </button>
              </div>
            ) : (
              <input
                className="input-field"
                value={user.user_metadata?.full_name || ""}
                disabled
                style={{ opacity: 0.7, cursor: "not-allowed" }}
              />
            )}
          </div>

          {/* Email field */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: 6,
              }}
            >
              {t("profile.email_label")}
            </label>
            <input
              className="input-field"
              value={user.email || ""}
              disabled
              style={{ opacity: 0.7, cursor: "not-allowed" }}
            />
          </div>

          {/* Newsletter toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 4,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>
                {t("profile.newsletter_sorell")}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {t("profile.newsletter_desc")}
              </div>
            </div>
            <button
              onClick={() => setNewsletter((v) => !v)}
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                background: newsletter ? "var(--accent)" : "var(--border)",
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
                  left: newsletter ? 21 : 3,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "white",
                  transition: "left 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "var(--border)", marginTop: 8 }} />

          {/* Delete account */}
          <button
            onClick={() => { setShowDeleteModal(true); setConfirmText(""); setDeleteError(""); }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              color: "var(--error)",
              opacity: 0.7,
              textAlign: "left",
              padding: 0,
            }}
          >
            {t("profile.delete_account")}
          </button>
        </div>
      </div>

      {/* Delete account modal */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 28,
              maxWidth: 400,
              width: "100%",
            }}
          >
            {/* Warning icon */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(239,68,68,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                fontSize: 22,
              }}
            >
              ⚠️
            </div>

            <h3
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: 10,
              }}
            >
              {t("profile.delete_account")}
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "var(--text-secondary)",
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              {t("profile.delete_warning")}
            </p>

            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: 6,
              }}
              dangerouslySetInnerHTML={{ __html: t("profile.delete_confirm") }}
            />
            <input
              className="input-field"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              style={{ marginBottom: 16 }}
            />

            {deleteError && (
              <p style={{ fontSize: 13, color: "var(--error)", marginBottom: 12 }}>
                {deleteError}
              </p>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                className="btn-ghost"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{ fontSize: 14, padding: "7px 14px" }}
              >
                {t("profile.cancel")}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={confirmText !== "SUPPRIMER" || deleting}
                style={{
                  fontSize: 14,
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: confirmText === "SUPPRIMER" && !deleting ? "var(--error)" : "rgba(239,68,68,0.3)",
                  color: "white",
                  cursor: confirmText === "SUPPRIMER" && !deleting ? "pointer" : "not-allowed",
                  fontWeight: 500,
                  transition: "background 0.2s ease",
                }}
              >
                {deleting ? t("profile.deleting") : t("profile.delete_permanently")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
