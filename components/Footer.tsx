"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer style={{ background: "#0f2b31", borderRadius: "20px 20px 0 0" }}>
      <style>{`
        .footer-inner {
          max-width: 72rem;
          margin: 0 auto;
          padding: 80px 1.5rem 40px;
        }
        .footer-cols {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          margin-bottom: 48px;
        }
        @media (max-width: 900px) {
          .footer-cols { grid-template-columns: repeat(2, 1fr); gap: 2.5rem 2rem; }
        }
        @media (max-width: 560px) {
          .footer-cols { grid-template-columns: 1fr; }
        }
        .footer-col-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #5EEAD4;
          margin: 0 0 16px;
          font-weight: 600;
        }
        .footer-links {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .footer-link-item {
          font-size: 14px;
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .footer-link-item:hover {
          color: rgba(255,255,255,1);
        }
        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          border-top: 1px solid rgba(255,255,255,0.07);
          padding-top: 24px;
        }
        .footer-bottom-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .footer-bottom-link {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .footer-bottom-link:hover {
          color: rgba(255,255,255,0.6);
        }
      `}</style>

      <div className="footer-inner">
        {/* 4 columns */}
        <div className="footer-cols">
          <div>
            <p className="footer-col-title">{t("footer.col_product")}</p>
            <div className="footer-links">
              <Link href="/comment-ca-marche" className="footer-link-item">{t("nav.how_it_works")}</Link>
              <Link href="/tarifs" className="footer-link-item">{t("nav.pricing")}</Link>
              <Link href="/demo" className="footer-link-item">{t("nav.demo")}</Link>
              <Link href="/blog" className="footer-link-item">Blog</Link>
            </div>
          </div>

          <div>
            <p className="footer-col-title">{t("footer.col_company")}</p>
            <div className="footer-links">
              <Link href="/contact" className="footer-link-item">{t("nav.contact")}</Link>
              <Link href="/contact" className="footer-link-item">{t("footer.about")}</Link>
            </div>
          </div>

          <div>
            <p className="footer-col-title">{t("footer.col_legal")}</p>
            <div className="footer-links">
              <Link href="/legal" className="footer-link-item">{t("footer.legal")}</Link>
              <Link href="/cgv" className="footer-link-item">{t("footer.cgv")}</Link>
              <Link href="/confidentialite" className="footer-link-item">{t("footer.privacy")}</Link>
            </div>
          </div>

          <div>
            <p className="footer-col-title">{t("footer.col_resources")}</p>
            <div className="footer-links">
              <Link href="/blog" className="footer-link-item">Blog</Link>
            </div>
          </div>
        </div>

        {/* CTA block */}
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: 24,
            marginBottom: 48,
            maxWidth: 420,
          }}
        >
          <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 6px", lineHeight: 1.4 }}>
            {t("footer.cta_title")}
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "0 0 18px", lineHeight: 1.5 }}>
            {t("footer.cta_subtitle")}
          </p>
          <Link
            href="/connexion"
            style={{
              display: "inline-block",
              background: "#fff",
              color: "#005058",
              borderRadius: 8,
              padding: "9px 20px",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.88"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
          >
            {t("footer.cta_btn")}
          </Link>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <img
            src="/icone.png"
            alt=""
            aria-hidden="true"
            style={{
              height: 56,
              width: "auto",
              opacity: 0.15,
              filter: "brightness(0) invert(1)",
              userSelect: "none",
              display: "block",
            }}
          />
          <div className="footer-bottom-right">
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
              &copy; 2026 Sorell
            </span>
            <Link href="/legal" className="footer-bottom-link">
              {t("footer.legal")}
            </Link>
            <Link href="/confidentialite" className="footer-bottom-link">
              {t("footer.privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
