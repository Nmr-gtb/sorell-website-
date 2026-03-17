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
  badge?: string;
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
  badge,
}: PricingCardProps) {
  const displayPrice =
    period === "annual" && annualPrice !== null ? annualPrice : price;

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "22px",
        background: "var(--surface)",
        border: popular
          ? "1.5px solid var(--accent)"
          : "1px solid var(--border)",
        boxShadow: popular
          ? "var(--shadow-lg), 0 0 0 1px var(--accent)"
          : "var(--shadow-sm)",
        transition: "box-shadow 0.2s ease",
      }}
    >
      {/* Badge */}
      {(popular || badge) && (
        <div
          style={{
            position: "absolute",
            top: -13,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "3px 14px",
              borderRadius: 999,
              fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
              fontSize: "0.6875rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              background: "var(--accent)",
              color: "var(--accent-text)",
              boxShadow: "0 4px 12px rgba(184,134,11,0.3)",
              whiteSpace: "nowrap",
            }}
          >
            {badge || "Recommandé"}
          </span>
        </div>
      )}

      {/* Plan info */}
      <div>
        <h3
          style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', Georgia, serif)",
            fontSize: "1.25rem",
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
            style={{
              fontFamily: "var(--font-display, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "1.75rem",
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            Sur devis
          </span>
        ) : (
          <>
            <span
              style={{
                fontFamily: "var(--font-display, 'Cormorant Garamond', Georgia, serif)",
                fontSize: "2.5rem",
                fontWeight: 700,
                color: "var(--text)",
                lineHeight: 1,
              }}
            >
              {displayPrice}€
            </span>
            <div style={{ display: "flex", flexDirection: "column", marginBottom: 4, gap: 2 }}>
              <span
                style={{
                  fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
                  fontSize: "0.8125rem",
                  color: "var(--text-secondary)",
                }}
              >
                /mois
              </span>
              {period === "annual" && (
                <span
                  style={{
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
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
            <span
              style={{
                color: popular ? "var(--accent)" : "var(--success)",
                fontWeight: 700,
                flexShrink: 0,
                marginTop: 1,
                fontSize: "0.9375rem",
                lineHeight: 1,
              }}
            >
              ✓
            </span>
            <span style={{ color: "var(--text-secondary)" }}>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={ctaHref}
        className={popular ? "btn-primary" : "btn-ghost"}
        style={{
          textAlign: "center",
          padding: "11px 20px",
          fontSize: "0.875rem",
          fontWeight: 600,
          justifyContent: "center",
        }}
      >
        {cta}
      </Link>
    </div>
  );
}
