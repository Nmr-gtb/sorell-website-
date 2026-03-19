"use client";

import { useRouter } from "next/navigation";

export default function CrownBadge({ tooltip }: { tooltip?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/tarifs")}
      title={tooltip || "Disponible avec un abonnement payant"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 20,
        background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
        border: "1px solid #F59E0B",
        color: "#92400E",
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(245, 158, 11, 0.3)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
        <path d="M2.5 19h19v2h-19zM22.5 7l-4.5 4.5L12 4l-6 7.5L1.5 7l2 10h17z"/>
      </svg>
      Pro
    </button>
  );
}
