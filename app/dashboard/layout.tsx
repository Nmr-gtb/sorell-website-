"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";

function Spinner() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ animation: "spin 0.75s linear infinite" }}
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </svg>
    </div>
  );
}


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/connexion");
    }
  }, [user, loading, router]);

  if (loading || !user) return <Spinner />;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <DashboardSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100vh" }}>
        <DashboardHeader onMenuClick={() => setSidebarOpen((v) => !v)} menuOpen={sidebarOpen} />
        <main style={{ flex: 1, background: "var(--bg)", overflowY: "auto", minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
