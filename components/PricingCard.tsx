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
  const displayPrice = period === "annual" && annualPrice !== null ? annualPrice : price;

  return (
    <div
      className="relative rounded-2xl p-7 flex flex-col gap-6 transition-all duration-300"
      style={{
        background: popular ? "rgba(124, 58, 237, 0.05)" : "#16161f",
        border: popular
          ? "1px solid rgba(124, 58, 237, 0.4)"
          : "1px solid #1e1e2a",
        boxShadow: popular
          ? "0 0 0 1px rgba(124,58,237,0.12), 0 16px 48px rgba(124,58,237,0.08)"
          : "none",
      }}
    >
      {popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span
            className="text-xs font-semibold px-3.5 py-1.5 rounded-full"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
              color: "white",
              boxShadow: "0 4px 12px rgba(124,58,237,0.4)",
            }}
          >
            ✦ Populaire
          </span>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: "#f0f0f5" }}>
          {name}
        </h3>
        <p className="text-sm" style={{ color: "#9090aa" }}>
          {tagline}
        </p>
      </div>

      <div className="flex items-end gap-1">
        {enterprise ? (
          <span className="text-3xl font-bold" style={{ color: "#f0f0f5" }}>
            Sur devis
          </span>
        ) : (
          <>
            <span className="text-4xl font-bold" style={{ color: "#f0f0f5" }}>
              {displayPrice}€
            </span>
            <span className="text-sm mb-1.5" style={{ color: "#9090aa" }}>
              /mois
              {period === "annual" && (
                <span
                  className="ml-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
                >
                  −20%
                </span>
              )}
            </span>
          </>
        )}
      </div>

      <ul className="space-y-3 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <svg
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              viewBox="0 0 16 16"
              fill="none"
              style={{ color: popular ? "#8b5cf6" : "#10b981" }}
            >
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
              <path
                d="M5 8l2 2 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span style={{ color: "#9090aa" }}>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={`text-center py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-200 ${
          popular ? "btn-accent" : "btn-ghost"
        }`}
        style={popular ? {} : { borderColor: "#2a2a3a" }}
      >
        {cta}
      </Link>
    </div>
  );
}
