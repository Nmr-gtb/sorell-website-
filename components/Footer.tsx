"use client";

import Link from "next/link";
import SorellLogo from "./SorellLogo";
import { useLanguage } from "@/lib/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          maxWidth: "72rem",
          margin: "0 auto",
          padding: "2rem 1.5rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <SorellLogo size="sm" />

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
          <Link href="/comment-ca-marche" className="footer-link">{t("nav.how_it_works")}</Link>
          <Link href="/tarifs" className="footer-link">{t("nav.pricing")}</Link>
          <Link href="/demo" className="footer-link">{t("nav.demo")}</Link>
          <Link href="/contact" className="footer-link">{t("nav.contact")}</Link>
          <Link href="/legal" className="footer-link">{t("footer.legal")}</Link>
          <Link href="/cgv" className="footer-link">{t("footer.cgv")}</Link>
          <Link href="/confidentialite" className="footer-link">{t("footer.privacy")}</Link>
        </div>

        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            © 2026 Sorell
          </p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, opacity: 0.7 }}>
            {t("footer.last_updated")}
          </p>
        </div>
      </div>
    </footer>
  );
}
