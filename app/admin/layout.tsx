"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  DashboardIcon,
  UsersIcon,
  MailIcon,
  LifecycleIcon,
  BotIcon,
  LogoutIcon,
  MenuIcon,
  SidebarCollapseIcon,
  SidebarExpandIcon,
} from "@/components/admin/AdminIcons";
import { SkeletonDashboard } from "@/components/admin/Skeleton";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: DashboardIcon },
  { href: "/admin/users", label: "Utilisateurs", icon: UsersIcon },
  { href: "/admin/newsletters", label: "Newsletters", icon: MailIcon },
  { href: "/admin/lifecycle", label: "Lifecycle Emails", icon: LifecycleIcon },
  { href: "/admin/prompts", label: "Prompts", icon: BotIcon },
];

const breadcrumbLabels: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/users": "Utilisateurs",
  "/admin/newsletters": "Newsletters",
  "/admin/lifecycle": "Lifecycle Emails",
  "/admin/prompts": "Prompts",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [verified, setVerified] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/admin/verify", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          router.push("/admin-login");
        } else {
          setVerified(true);
        }
      })
      .catch(() => router.push("/admin-login"));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.push("/admin-login");
  }

  function getBreadcrumb(): string {
    if (breadcrumbLabels[pathname]) return breadcrumbLabels[pathname];
    if (pathname.startsWith("/admin/users/")) return "Détail utilisateur";
    return "Admin";
  }

  if (!verified) {
    return (
      <div className="min-h-screen bg-[var(--surface-alt)] p-8">
        <SkeletonDashboard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-alt)] text-[var(--text)]">
      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 lg:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
          aria-label="Ouvrir le menu"
        >
          <MenuIcon size={22} />
        </button>
        <span
          className="text-lg font-bold text-[var(--text)]"
          style={{ fontFamily: "'Quiglet', sans-serif" }}
        >
          Sorell
        </span>
        <button
          onClick={handleLogout}
          className="rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:text-red-500"
          aria-label="Se déconnecter"
        >
          <LogoutIcon size={20} />
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-300 lg:static lg:z-auto ${
            sidebarCollapsed ? "lg:w-[72px]" : "lg:w-[260px]"
          } ${sidebarOpen ? "w-60 translate-x-0" : "w-60 -translate-x-full lg:translate-x-0"}`}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-6">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
                  <span className="text-base font-bold text-[var(--accent)]">S</span>
                </div>
                <div className="hidden lg:block">
                  <div
                    className="text-base font-bold text-[var(--text)]"
                    style={{ fontFamily: "'Quiglet', sans-serif" }}
                  >
                    Sorell
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
                    Admin
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)] lg:block"
              aria-label={sidebarCollapsed ? "Étendre le menu" : "Réduire le menu"}
            >
              {sidebarCollapsed ? <SidebarExpandIcon size={18} /> : <SidebarCollapseIcon size={18} />}
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-4 py-5 space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                  } ${sidebarCollapsed ? "justify-center" : ""}`}
                  title={sidebarCollapsed ? item.label : undefined}
                  aria-label={item.label}
                >
                  <Icon
                    size={20}
                    className={`flex-shrink-0 transition-colors ${
                      isActive ? "text-white" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                    }`}
                  />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-[var(--border)] px-3 py-4">
            <button
              onClick={handleLogout}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all duration-150 hover:bg-red-50 hover:text-red-500 ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
              aria-label="Se déconnecter"
            >
              <LogoutIcon size={20} className="flex-shrink-0" />
              {!sidebarCollapsed && <span>Déconnexion</span>}
            </button>
          </div>
        </aside>

        {/* Backdrop mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-h-screen">
          {/* Top bar — InsightHub style */}
          <div className="hidden lg:flex items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-10 py-4">
            <div className="flex-1">
              <div className="text-lg font-bold text-[var(--text)]">Bonjour, Noé</div>
              <div className="text-[13px] text-[var(--text-muted)]">
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <span className="text-sm text-[var(--text-muted)]">Rechercher...</span>
              </div>
              <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)]" aria-label="Paramètres">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)]" aria-label="Notifications">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </button>
            </div>
          </div>
          <div className="p-8 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
