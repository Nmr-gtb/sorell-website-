"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(10, 10, 15, 0.85)"
          : "rgba(10, 10, 15, 0.0)",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid #1e1e2a" : "1px solid transparent",
      }}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-base transition-all duration-200 group-hover:scale-105"
            style={{ background: "#7c3aed", fontFamily: "Georgia, serif" }}
          >
            S
          </div>
          <span className="text-base font-semibold tracking-tight" style={{ color: "#f0f0f5" }}>
            Sorell
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/#features"
            className="px-4 py-2 text-sm rounded-lg transition-all duration-200"
            style={{
              color: "#9090aa",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.color = "#f0f0f5";
              (e.target as HTMLElement).style.background = "#16161f";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.color = "#9090aa";
              (e.target as HTMLElement).style.background = "transparent";
            }}
          >
            Fonctionnalités
          </Link>
          <Link
            href="/pricing"
            className="px-4 py-2 text-sm rounded-lg transition-all duration-200"
            style={{
              color: pathname === "/pricing" ? "#f0f0f5" : "#9090aa",
              background: pathname === "/pricing" ? "#16161f" : "transparent",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.color = "#f0f0f5";
              (e.target as HTMLElement).style.background = "#16161f";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.color = pathname === "/pricing" ? "#f0f0f5" : "#9090aa";
              (e.target as HTMLElement).style.background = pathname === "/pricing" ? "#16161f" : "transparent";
            }}
          >
            Tarifs
          </Link>
          <Link
            href="/demo"
            className="px-4 py-2 text-sm rounded-lg transition-all duration-200"
            style={{
              color: pathname === "/demo" ? "#f0f0f5" : "#9090aa",
              background: pathname === "/demo" ? "#16161f" : "transparent",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.color = "#f0f0f5";
              (e.target as HTMLElement).style.background = "#16161f";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.color = pathname === "/demo" ? "#f0f0f5" : "#9090aa";
              (e.target as HTMLElement).style.background = pathname === "/demo" ? "#16161f" : "transparent";
            }}
          >
            Démo
          </Link>
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="btn-accent px-4 py-2 text-sm"
          >
            Se connecter
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span
            className="block w-5 h-0.5 rounded transition-all duration-200"
            style={{
              background: "#f0f0f5",
              transform: mobileOpen ? "rotate(45deg) translate(4px, 4px)" : "none",
            }}
          />
          <span
            className="block w-5 h-0.5 rounded transition-all duration-200"
            style={{
              background: "#f0f0f5",
              opacity: mobileOpen ? 0 : 1,
            }}
          />
          <span
            className="block w-5 h-0.5 rounded transition-all duration-200"
            style={{
              background: "#f0f0f5",
              transform: mobileOpen ? "rotate(-45deg) translate(4px, -4px)" : "none",
            }}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden px-6 pb-4 flex flex-col gap-1"
          style={{ background: "rgba(10, 10, 15, 0.95)", borderBottom: "1px solid #1e1e2a" }}
        >
          <Link
            href="/#features"
            className="px-3 py-2.5 text-sm rounded-lg"
            style={{ color: "#9090aa" }}
            onClick={() => setMobileOpen(false)}
          >
            Fonctionnalités
          </Link>
          <Link
            href="/pricing"
            className="px-3 py-2.5 text-sm rounded-lg"
            style={{ color: "#9090aa" }}
            onClick={() => setMobileOpen(false)}
          >
            Tarifs
          </Link>
          <Link
            href="/demo"
            className="px-3 py-2.5 text-sm rounded-lg"
            style={{ color: "#9090aa" }}
            onClick={() => setMobileOpen(false)}
          >
            Démo
          </Link>
          <Link
            href="/login"
            className="btn-accent px-4 py-2.5 text-sm text-center mt-2"
            onClick={() => setMobileOpen(false)}
          >
            Se connecter
          </Link>
        </div>
      )}
    </header>
  );
}
