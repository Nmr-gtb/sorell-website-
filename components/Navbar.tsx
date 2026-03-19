"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import SorellLogo from "./SorellLogo";
import { useAuth } from "@/lib/AuthContext";

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("sorell-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("sorell-theme", "light");
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label="Basculer le thème"
      style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "1px solid var(--border)",
        cursor: "pointer",
        color: "var(--text-muted)",
        transition: "border-color 0.15s ease, color 0.15s ease",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border-hover)";
        el.style.color = "var(--text-secondary)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border)";
        el.style.color = "var(--text-muted)";
      }}
    >
      {isDark ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navLinks = [
    { href: "/#fonctionnalites", label: "Fonctionnalités" },
    { href: "/comment-ca-marche", label: "Comment ça marche" },
    { href: "/tarifs", label: "Tarifs" },
    { href: "/demo", label: "Démo" },
    { href: "/contact", label: "Contact" },
  ];

  const isActive = (href: string) =>
    href.startsWith("/#") ? false : pathname === href;

  const close = () => setMobileOpen(false);

  return (
    <>
      <style>{`
        [data-theme="dark"] header.sorell-navbar {
          background: ${scrolled ? "rgba(15,17,23,0.92)" : "transparent"} !important;
        }
        .nav-desktop { display: none !important; }
        .nav-mobile-controls { display: flex !important; }
        @media (min-width: 900px) {
          .nav-desktop { display: flex !important; }
          .nav-mobile-controls { display: none !important; }
        }
        .mobile-nav-link:hover {
          background: var(--surface-hover) !important;
          color: var(--text) !important;
        }
        .mobile-auth-link:hover {
          background: var(--surface-hover) !important;
          color: var(--text) !important;
        }
      `}</style>

      <header
        className="sorell-navbar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
          transition: "background 0.2s ease, border-color 0.2s ease",
        }}
      >
        <nav
          style={{
            maxWidth: "72rem",
            margin: "0 auto",
            padding: "0 1.5rem",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <SorellLogo />

          {/* Desktop center links */}
          <div style={{ alignItems: "center", gap: 4 }} className="nav-desktop">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  fontSize: "0.875rem",
                  fontWeight: 400,
                  color: isActive(href) ? "var(--text)" : "var(--text-secondary)",
                  transition: "color 0.15s ease",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive(href)) {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                  }
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop right */}
          <div style={{ alignItems: "center", gap: 8 }} className="nav-desktop">
            <ThemeToggle />
            <Link
              href={user ? "/dashboard" : "/connexion"}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: "0.875rem",
                fontWeight: 400,
                color: "var(--text-secondary)",
                textDecoration: "none",
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              }}
            >
              {user ? "Dashboard" : "Se connecter"}
            </Link>
            <Link
              href="/#waitlist"
              className="btn-primary"
              style={{ padding: "7px 16px", fontSize: "0.875rem" }}
            >
              Commencer
            </Link>
          </div>

          {/* Mobile controls: theme toggle + hamburger */}
          <div style={{ alignItems: "center", gap: 8 }} className="nav-mobile-controls">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileOpen}
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                background: "transparent",
                border: "1px solid var(--border)",
                cursor: "pointer",
                padding: "6px",
              }}
            >
              <span style={{
                display: "block",
                width: 14,
                height: 1.5,
                borderRadius: 1,
                background: "var(--text)",
                transform: mobileOpen ? "rotate(45deg) translate(4px, 4px)" : "none",
                transition: "transform 0.2s ease",
              }} />
              <span style={{
                display: "block",
                width: 14,
                height: 1.5,
                borderRadius: 1,
                background: "var(--text)",
                opacity: mobileOpen ? 0 : 1,
                transition: "opacity 0.2s ease",
              }} />
              <span style={{
                display: "block",
                width: 14,
                height: 1.5,
                borderRadius: 1,
                background: "var(--text)",
                transform: mobileOpen ? "rotate(-45deg) translate(4px, -4px)" : "none",
                transition: "transform 0.2s ease",
              }} />
            </button>
          </div>
        </nav>
      </header>

      {/* Overlay */}
      <div
        onClick={close}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 98,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Slide drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "min(280px, 85vw)",
          height: "100vh",
          zIndex: 99,
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Drawer header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          height: 60,
          flexShrink: 0,
        }}>
          <SorellLogo size="sm" />
          <button
            onClick={close}
            aria-label="Fermer le menu"
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "1px solid var(--border)",
              cursor: "pointer",
              color: "var(--text-muted)",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: "var(--border)", flexShrink: 0 }} />

        {/* Nav links */}
        <nav style={{ display: "flex", flexDirection: "column", padding: "8px 0" }}>
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              className="mobile-nav-link"
              style={{
                padding: "14px 20px",
                fontSize: 15,
                fontWeight: 500,
                color: isActive(href) ? "var(--accent)" : "var(--text-secondary)",
                textDecoration: "none",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Separator */}
        <div style={{ height: 1, background: "var(--border)", flexShrink: 0 }} />

        {/* CTA buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 20 }}>
          <Link
            href={user ? "/dashboard" : "/connexion"}
            onClick={close}
            className="mobile-auth-link"
            style={{
              padding: "12px 20px",
              borderRadius: 6,
              fontSize: 15,
              fontWeight: 500,
              color: "var(--text-secondary)",
              textDecoration: "none",
              textAlign: "center",
              transition: "background 0.15s ease, color 0.15s ease",
              border: "1px solid var(--border)",
            }}
          >
            {user ? "Dashboard" : "Se connecter"}
          </Link>
          <Link
            href="/#waitlist"
            onClick={close}
            className="btn-primary"
            style={{
              padding: 12,
              fontSize: 15,
              textAlign: "center",
              width: "100%",
              display: "block",
              boxSizing: "border-box",
            }}
          >
            Commencer
          </Link>
        </div>
      </div>
    </>
  );
}
