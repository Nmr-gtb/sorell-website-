"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/database";
import { useDevMode } from "@/lib/DevModeContext";
import { useLanguage } from "@/lib/LanguageContext";

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20h18" />
      <path d="M7 20V10" />
      <path d="M12 20V6" />
      <path d="M17 20v-4" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#EAB308" stroke="#EAB308" strokeWidth="1.5" title="Disponible avec le plan Pro">
      <title>Disponible avec le plan Pro</title>
      <path d="M2 20h20L19 9l-5 4-2-6-2 6-5-4z"/>
    </svg>
  );
}

function IconPalette() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5"/>
      <circle cx="17.5" cy="10.5" r="2.5"/>
      <circle cx="8.5" cy="7.5" r="2.5"/>
      <circle cx="6.5" cy="12" r="2.5"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  );
}

function IconHistory() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// navItems is built inside the component to use t()

function getInitials(user: { user_metadata?: { full_name?: string }; email?: string }) {
  const name = user.user_metadata?.full_name;
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  return (user.email?.[0] ?? "?").toUpperCase();
}

function getDisplayName(user: { user_metadata?: { full_name?: string }; email?: string }) {
  return user.user_metadata?.full_name || user.email || "";
}

interface Props {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function DashboardSidebar({ mobileOpen, onClose }: Props) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [realPlan, setRealPlan] = useState<string>("free");
  const { getEffectivePlan } = useDevMode();
  const plan = getEffectivePlan(realPlan);

  const navItems = [
    { label: t("dash.overview"), href: "/dashboard", icon: <IconGrid />, crown: false },
    { label: t("dash.newsletter"), href: "/dashboard/config", icon: <IconMail />, crown: false },
    { label: t("dash.generate"), href: "/dashboard/generate", icon: <IconSparkles />, crown: false },
    { label: t("dash.history"), href: "/dashboard/historique", icon: <IconHistory />, crown: false },
    { label: t("dash.customization"), href: "/dashboard/customization", icon: <IconPalette />, crown: plan === "free" },
    { label: t("dash.analytics"), href: "/dashboard/analytics", icon: <IconChart />, crown: false },
    { label: t("dash.profile"), href: "/dashboard/profile", icon: <IconUser />, crown: false },
  ];

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then(({ data }) => {
      if (data?.plan) setRealPlan(data.plan);
    });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div
      style={{
        width: 240,
        minHeight: "100vh",
        background: "var(--surface-alt)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "16px 0",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "4px 16px 16px" }}>
        <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
          <span
            style={{
              fontFamily: "var(--font-inter, 'Inter', sans-serif)",
              fontSize: "1.125rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text)",
              lineHeight: 1,
            }}
          >
            Sorel<span style={{ color: "var(--accent)" }}>l</span>
          </span>
        </Link>
      </div>

      {/* Separator */}
      <div style={{ height: 1, background: "var(--border)", marginBottom: 12 }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: isActive(item.href) ? 500 : 400,
              color: isActive(item.href) ? "var(--accent)" : "var(--text-secondary)",
              background: isActive(item.href) ? "var(--accent-subtle)" : "transparent",
              textDecoration: "none",
              transition: "background 0.1s ease, color 0.1s ease",
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.href)) {
                (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface-hover)";
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.href)) {
                (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
              }
            }}
          >
            <span style={{ opacity: isActive(item.href) ? 1 : 0.7, display: "flex" }}>{item.icon}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {item.label}
              {item.crown && <CrownIcon />}
            </span>
          </Link>
        ))}
      </nav>

      {/* Upgrade banner - free plan only */}
      {plan === "free" && (
        <div style={{ padding: "0 8px 8px" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
              border: "1px solid #F59E0B",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <p style={{ fontSize: 12, color: "#92400E", margin: "0 0 8px", fontWeight: 500, lineHeight: 1.4 }}>
              {t("dash.upgrade_text")}
            </p>
            <button
              onClick={() => router.push("/tarifs")}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#92400E",
                background: "rgba(245,158,11,0.2)",
                border: "1px solid #F59E0B",
                borderRadius: 6,
                padding: "4px 10px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              {t("dash.upgrade_btn")}
            </button>
          </div>
        </div>
      )}

      {/* User block */}
      {user && (
        <div style={{ padding: "12px 8px 0", borderTop: "1px solid var(--border)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: 6,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--accent)",
                color: "var(--accent-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {getInitials(user)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {getDisplayName(user)}
              </div>
              {user.user_metadata?.full_name && (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.email}
                </div>
              )}
            </div>
          </div>
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 12px",
              fontSize: 13,
              color: "var(--text-muted)",
              textDecoration: "none",
              borderRadius: 8,
              marginBottom: 2,
              transition: "background 0.1s ease, color 0.1s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface-hover)";
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Retour au site
          </a>
          <button
            onClick={handleSignOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "7px 12px",
              borderRadius: 6,
              fontSize: 13,
              color: "var(--text-muted)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.1s ease, color 0.1s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-hover)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
            }}
          >
            <IconLogout />
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="dashboard-sidebar-desktop">{sidebarContent}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
          }}
        >
          {/* Backdrop */}
          <div
            onClick={onClose}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
            }}
          />
          {/* Sidebar */}
          <div style={{ position: "relative", zIndex: 1 }}>{sidebarContent}</div>
        </div>
      )}

      <style>{`
        .dashboard-sidebar-desktop {
          display: flex;
        }
        @media (max-width: 768px) {
          .dashboard-sidebar-desktop {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
