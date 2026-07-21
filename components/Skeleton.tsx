"use client";

import type { CSSProperties } from "react";

// Bloc de chargement qui reproduit la forme du contenu attendu (règle maison :
// pas de spinner générique). L'animation ne touche que l'opacité (GPU).
// Les @keyframes skeleton-pulse sont définies dans app/globals.css.
export default function Skeleton({
  width = "100%",
  height = 16,
  radius = 8,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden={true}
      style={{
        width,
        height,
        borderRadius: radius,
        background: "var(--border)",
        animation: "skeleton-pulse 1.4s ease-in-out infinite",
        ...style,
      }}
    />
  );
}
