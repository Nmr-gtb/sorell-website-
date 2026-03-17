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
        gap: "20px",
        background: "var(--surface)",
        border: popular
          ? "1.5px solid var(--accent)"
          : "1px solid var(--border)",
      }}
    >
      {/* Badge */}
      {(popular || badge) && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "2px 12px",
              borderRadius: 999,
              fontFamily: "var(--font-inter, 'Inter', sans-serif)",
              fontSize: "0.6875rem",
              fontWeight: 600,
              letterSpacing: "0.03em",
              background: "var(--accent)",
              color: "white",
              whiteSpace: "nowrap",
            }}
          >
            {badge || "Populaire"}
          </span>
        </div>
      )}

      {/* Plan info */}
      <div>
        <h3
          style={{
            fontFamily: "var(--font-inter, 'Inter', sans-serif)",
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: 4,
            letterSpacing: "-0.01em",
          }}
        >
          {name}
        </h3>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          {tagline}
        </p>
      </div>

      {/* Price */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        {enterprise ? (
          <span
            style={{
              fontFamily: "var(--font-inter, 'Inter', sans-serif)",
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "-0.02em",
            }}
          >
            Sur devis
          </span>
        ) : (
          <>
            <span
              style={{
                fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                fontSize: "2.25rem",
                fontWeight: 700,
                color: "var(--text)",
                lineHeight: 1,
                letterSpacing: "-0.03em",
              }}
            >
              {displayPrice}€
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                /mois
              </span>
              {period === "annual" && (
                <span
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
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              style={{ flexShrink: 0, marginTop: 2, color: popular ? "var(--accent)" : "var(--success)" }}
            >
              <path
                d="M3 8l3.5 3.5 6.5-7"
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
        className={popular ? "btn-primary" : "btn-ghost"}
        style={{
          textAlign: "center",
          padding: "10px 20px",
          fontSize: "0.875rem",
          justifyContent: "center",
        }}
      >
        {cta}
      </Link>
    </div>
  );
}
