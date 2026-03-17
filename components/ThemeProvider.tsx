"use client";

import { useEffect } from "react";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Sync toggle state on mount (script in <head> already sets the attr)
    const stored = localStorage.getItem("sorell-theme");
    if (stored === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  return <>{children}</>;
}
