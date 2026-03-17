"use client";

import Link from "next/link";

interface PricingCardProps {
  name: string;
  price: number | null;
  annualPrice: number | null;
  period: "monthly" | "annual";
  tagline: string;
  features: string[];
  cta: string;
  ctaHref: string;
  popular?: boolean;
  enterprise?: boolean;
}

export default function PricingCard({
  name,
  price,
  annualPrice,
  period,
  tagline,
  features,
  cta,
  ctaHref,
  popular,
  enterprise,
}: PricingCardProps) {
  const displayPrice =
    period === "annual" && annualPrice !== null ? annualPrice : price;

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 16,
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        background: popular ? "var(--surface)" : "var(--surface)",
        border: popular
          ? "1.5px solid var(--accent)"
          : "1px solid var(--border)",
        boxShadow: popular ? "var(--shadow-lg)" : "var(--shadow-sm)",
        transition: "box-shadow 0.2s ease",
      }}
    >
      {popular && (
        <div
          style={{
            position: "absolute",
            top: -13,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <span
            className="font-mono"
            style={{
              display: "inline-block",
              padding: "4px 14px",
              borderRadius: 999,
              fontSize: "0.6875rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              background: "var(--accent)",
              color: "white",
              boxShadow: "0 4px 12px rgba(193, 95, 60, 0.3)",
              whiteSpace: "nowrap",
            }}
          >
            Recommandé
          </span>
        </div>
      )}

      {/* Plan info */}
      <div>
        <h3
          className="font-display"
          style={{
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: 4,
          }}
        >
          {name}
        </h3>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          {tagline}
        </p>
      </div>

      {/* Price */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
        {enterprise ? (
          <span
            className="font-display"
            style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--text)" }}
          >
            Sur devis
          </span>
        ) : (
          <>
            <span
              className="font-display"
              style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--text)", lineHeight: 1 }}
            >
              {displayPrice}€
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: 4,
                gap: 2,
              }}
            >
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                /mois
              </span>
              {period === "annual" && (
                <span
                  className="font-mono"
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    padding: "1px 6px",
                    borderRadius: 4,
                    background: "var(--success-bg)",
                    color: "var(--success)",
                  }}
                >
                  −20%
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Features */}
      <ul style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {features.map((feature, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              fontSize: "0.875rem",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill="none"
              style={{ color: popular ? "var(--accent)" : "var(--success)", flexShrink: 0, marginTop: 1 }}
            >
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" opacity="0.35" />
              <path
                d="M5 8l2 2 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span style={{ color: "var(--text-secondary)" }}>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={ctaHref}
        className={popular ? "btn-accent" : "btn-ghost"}
        style={{
          textAlign: "center",
          padding: "11px 20px",
          fontSize: "0.875rem",
          fontWeight: 600,
        }}
      >
        {cta}
      </Link>
    </div>
  );
}
