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

  const navLinks = [
    { href: "/#features", label: "Fonctionnalités" },
    { href: "/pricing", label: "Tarifs" },
    { href: "/demo", label: "Démo" },
    { href: "/contact", label: "Contact" },
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
        background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
    >
      <style>{`
        [data-theme="dark"] header {
          background: ${scrolled ? "rgba(15,17,23,0.92)" : "transparent"} !important;
        }
      `}</style>

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
        <div
          style={{ display: "flex", alignItems: "center", gap: 4 }}
          className="hidden md:flex"
        >
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
        <div
          style={{ display: "flex", alignItems: "center", gap: 8 }}
          className="hidden md:flex"
        >
          <ThemeToggle />
          <Link
            href={user ? "/dashboard" : "/login"}
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

        {/* Mobile */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 8 }}
          className="md:hidden flex"
        >
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
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

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          style={{
            background: "var(--bg)",
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
                padding: "10px 8px",
                fontSize: "0.875rem",
                fontWeight: 400,
                color: "var(--text-secondary)",
                textDecoration: "none",
              }}
            >
              {label}
            </Link>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            <Link
              href={user ? "/dashboard" : "/login"}
              onClick={() => setMobileOpen(false)}
              className="btn-ghost"
              style={{ justifyContent: "center", padding: "10px", width: "100%", fontSize: "0.875rem" }}
            >
              {user ? "Dashboard" : "Se connecter"}
            </Link>
            <Link
              href="/#waitlist"
              onClick={() => setMobileOpen(false)}
              className="btn-primary"
              style={{ justifyContent: "center", padding: "10px", width: "100%", fontSize: "0.875rem" }}
            >
              Commencer
            </Link>
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 4 }}>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
