"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

interface Props {
  onMenuClick: () => void;
  menuOpen?: boolean;
}

function getPageTitle(pathname: string, t: (key: string) => string): string {
  if (pathname === "/dashboard") return t("dash.overview");
  if (pathname.startsWith("/dashboard/config")) return t("dash.newsletter");
  if (pathname.startsWith("/dashboard/customization")) return t("dash.newsletter");
  if (pathname.startsWith("/dashboard/generate")) return t("dash.generate");
  if (pathname.startsWith("/dashboard/analytics")) return t("dash.analytics");
  if (pathname.startsWith("/dashboard/historique")) return t("dash.analytics");
  if (pathname.startsWith("/dashboard/profile")) return t("dash.profile");
  return "Dashboard";
}

export default function DashboardHeader({ onMenuClick, menuOpen }: Props) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const pageTitle = getPageTitle(pathname, t);

  return (
    <header
      className="dashboard-header"
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "0 20px",
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 20,
        flexShrink: 0,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        backgroundColor: "rgba(var(--surface-rgb, 255,255,255), 0.85)",
      }}
    >
      {/* Left: hamburger (mobile) + page title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Hamburger - mobile only */}
        <button
          className="dashboard-header-hamburger"
          onClick={onMenuClick}
          aria-label={menuOpen ? t("common.close_menu") : t("common.open_menu")}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            cursor: "pointer",
            color: "var(--text)",
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            width: 34,
            height: 34,
            borderRadius: 8,
            position: "relative",
            transition: "border-color 0.15s ease",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 16,
              height: 12,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                display: "block",
                width: 16,
                height: 2,
                borderRadius: 1,
                background: "currentColor",
                transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
                transformOrigin: "center",
                transform: menuOpen ? "translateY(5px) rotate(45deg)" : "none",
              }}
            />
            <span
              style={{
                display: "block",
                width: menuOpen ? 0 : 16,
                height: 2,
                borderRadius: 1,
                background: "currentColor",
                transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              style={{
                display: "block",
                width: 16,
                height: 2,
                borderRadius: 1,
                background: "currentColor",
                transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
                transformOrigin: "center",
                transform: menuOpen ? "translateY(-5px) rotate(-45deg)" : "none",
              }}
            />
          </div>
        </button>

        {/* Page title */}
        <h1
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text)",
            margin: 0,
            whiteSpace: "nowrap",
          }}
        >
          {pageTitle}
        </h1>
      </div>

      {/* Right: back to site link */}
      <Link
        href="/"
        className="dashboard-header-back"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 400,
          color: "var(--text-muted)",
          textDecoration: "none",
          padding: "5px 10px",
          borderRadius: 6,
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
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="dashboard-header-back-label">{t("sidebar.back_to_site")}</span>
      </Link>

      <style>{`
        .dashboard-header-hamburger { display: none; }
        @media (max-width: 768px) {
          .dashboard-header-hamburger { display: flex !important; }
          .dashboard-header-back-label { display: none; }
        }
      `}</style>
    </header>
  );
}
