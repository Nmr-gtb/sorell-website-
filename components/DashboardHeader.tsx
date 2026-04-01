"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface Props {
  onMenuClick: () => void;
  menuOpen?: boolean;
}

const navLinks = [
  { label: "Accueil", href: "/" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Contact", href: "/contact" },
  { label: "Dashboard", href: "/dashboard" },
];

export default function DashboardHeader({ onMenuClick, menuOpen }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname.startsWith("/dashboard");
    return false;
  };

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
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
        <Image src="/icone.png" alt="Sorell" width={30} height={30} style={{ height: 30, width: "auto", display: "block" }} />
      </Link>

      {/* Nav links - desktop */}
      <nav
        className="dashboard-header-nav"
        style={{ display: "flex", alignItems: "center", gap: 2 }}
      >
        {navLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? "#005058" : "var(--text-secondary)",
                textDecoration: "none",
                padding: "5px 10px",
                borderRadius: 6,
                transition: "background 0.1s ease, color 0.1s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface-hover)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
                }
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Animated hamburger - mobile only */}
      <button
        className="dashboard-header-hamburger"
        onClick={onMenuClick}
        aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text)",
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          padding: 6,
          width: 36,
          height: 36,
          borderRadius: 8,
          position: "relative",
          transition: "background 0.2s ease",
        }}
      >
        <div
          style={{
            width: 18,
            height: 14,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Top line */}
          <span
            style={{
              display: "block",
              width: 18,
              height: 2,
              borderRadius: 1,
              background: "currentColor",
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
              transformOrigin: "center",
              transform: menuOpen ? "translateY(6px) rotate(45deg)" : "none",
            }}
          />
          {/* Middle line */}
          <span
            style={{
              display: "block",
              width: menuOpen ? 0 : 18,
              height: 2,
              borderRadius: 1,
              background: "currentColor",
              transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
              opacity: menuOpen ? 0 : 1,
            }}
          />
          {/* Bottom line */}
          <span
            style={{
              display: "block",
              width: 18,
              height: 2,
              borderRadius: 1,
              background: "currentColor",
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease",
              transformOrigin: "center",
              transform: menuOpen ? "translateY(-6px) rotate(-45deg)" : "none",
            }}
          />
        </div>
      </button>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-header-nav { display: none !important; }
          .dashboard-header-hamburger { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
