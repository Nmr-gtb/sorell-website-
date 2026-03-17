"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import SorellLogo from "./SorellLogo";

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
        width: 34,
        height: 34,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "1px solid var(--border)",
        cursor: "pointer",
        color: "var(--text-secondary)",
        transition: "all 0.18s ease",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--accent-border)";
        el.style.color = "var(--accent)";
        el.style.background = "var(--accent-subtle)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border)";
        el.style.color = "var(--text-secondary)";
        el.style.background = "transparent";
      }}
    >
      {isDark ? (
        // Sun icon — click to go light
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        // Moon icon — click to go dark
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/#features", label: "Fonctionnalités" },
    { href: "/pricing", label: "Tarifs" },
    { href: "/demo", label: "Démo" },
  ];

  const isActive = (href: string) =>
    href.startsWith("/#") ? false : pathname === href;

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: scrolled ? "rgba(254,252,248,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(1.3)" : "none",
        borderBottom: scrolled ? "1px solid var(--border-subtle)" : "1px solid transparent",
        transition: "background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
      }}
    >
      {/* Dark mode override via CSS-in-JS */}
      <style>{`
        [data-theme="dark"] header[style] {
          background: ${scrolled ? "rgba(26,25,21,0.92)" : "transparent"} !important;
        }
      `}</style>

      <nav
        style={{
          maxWidth: "72rem",
          margin: "0 auto",
          padding: "0 1.5rem",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <SorellLogo />

        {/* Desktop links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
          className="hidden md:flex"
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: "0.875rem",
                fontWeight: 500,
                color: isActive(href) ? "var(--text)" : "var(--text-secondary)",
                background: isActive(href) ? "var(--surface-alt)" : "transparent",
                transition: "all 0.18s ease",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive(href)) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "var(--text)";
                  el.style.background = "var(--surface-alt)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(href)) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "var(--text-secondary)";
                  el.style.background = "transparent";
                }
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side — desktop */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 8 }}
          className="hidden md:flex"
        >
          <ThemeToggle />
          <Link
            href="/login"
            className="btn-ghost"
            style={{ padding: "7px 18px", fontSize: "0.875rem" }}
          >
            Se connecter
          </Link>
        </div>

        {/* Mobile: theme + hamburger */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 8 }}
          className="md:hidden flex"
        >
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              background: "transparent",
              border: "1px solid var(--border)",
              cursor: "pointer",
              padding: "8px",
            }}
          >
            <span style={{
              display: "block",
              width: 16,
              height: 1.5,
              borderRadius: 1,
              background: "var(--text)",
              transform: mobileOpen ? "rotate(45deg) translate(4.5px, 4.5px)" : "none",
              transition: "transform 0.2s ease",
            }} />
            <span style={{
              display: "block",
              width: 16,
              height: 1.5,
              borderRadius: 1,
              background: "var(--text)",
              opacity: mobileOpen ? 0 : 1,
              transition: "opacity 0.2s ease",
            }} />
            <span style={{
              display: "block",
              width: 16,
              height: 1.5,
              borderRadius: 1,
              background: "var(--text)",
              transform: mobileOpen ? "rotate(-45deg) translate(4.5px, -4.5px)" : "none",
              transition: "transform 0.2s ease",
            }} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          style={{
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            padding: "8px 16px 16px",
          }}
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "block",
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "var(--text-secondary)",
                textDecoration: "none",
              }}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="btn-ghost"
            style={{ width: "100%", marginTop: 8, padding: "10px", justifyContent: "center" }}
          >
            Se connecter
          </Link>
        </div>
      )}
    </header>
  );
}
