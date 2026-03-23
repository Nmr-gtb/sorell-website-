"use client";

import { useDevMode } from "@/lib/DevModeContext";

const PLANS = ["free", "pro", "business", "enterprise"] as const;

export default function DevModeToggle() {
  const { isAdmin, devMode, simulatedPlan, toggleDevMode, setSimulatedPlan } = useDevMode();

  if (!isAdmin) return null;

  if (devMode) {
    return (
      <div
        onClick={toggleDevMode}
        title="Dev mode actif - cliquer pour simuler un plan"
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 1000,
          background: "#111827",
          color: "#4ADE80",
          borderRadius: 20,
          padding: "4px 12px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          userSelect: "none",
          border: "1px solid #374151",
        }}
      >
        DEV
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 1000,
        background: "#111827",
        border: "1px solid #374151",
        borderRadius: 8,
        padding: "6px 10px",
        display: "flex",
        alignItems: "center",
        gap: 6,
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        fontSize: 12,
      }}
    >
      <span style={{ color: "#9CA3AF", fontWeight: 500, marginRight: 2 }}>Vue :</span>
      {PLANS.map((p) => (
        <button
          key={p}
          onClick={() => setSimulatedPlan(p)}
          style={{
            padding: "3px 9px",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            background: simulatedPlan === p ? "var(--accent, #6366F1)" : "transparent",
            color: simulatedPlan === p ? "#fff" : "#9CA3AF",
            transition: "background 0.15s ease, color 0.15s ease",
            textTransform: "capitalize",
          }}
        >
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </button>
      ))}
      <button
        onClick={toggleDevMode}
        title="Réactiver le dev mode"
        style={{
          marginLeft: 4,
          padding: "2px 6px",
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
          background: "transparent",
          color: "#6B7280",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
