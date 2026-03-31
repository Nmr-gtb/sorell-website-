"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface Props {
  onMenuClick: () => void;
}

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

const navLinks = [
  { label: "Accueil", href: "/" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Contact", href: "/contact" },
  { label: "Dashboard", href: "/dashboard" },
];

export default function DashboardHeader({ onMenuClick }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname.startsWith("/dashboard");
    return false;
  };

  return (
    <header
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
        zIndex: 10,
        flexShrink: 0,
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

      {/* Hamburger - mobile only */}
      <button
        className="dashboard-header-hamburger"
        onClick={onMenuClick}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text)",
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          padding: 4,
        }}
      >
        <IconMenu />
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
