"use client";

import { useEffect } from "react";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Sync theme on mount (the <script> in <head> already sets the attr before hydration)
    try {
      const stored = localStorage.getItem("sorell-theme");
      if (stored === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      }
    } catch (_) {}
  }, []);

  return <>{children}</>;
}
