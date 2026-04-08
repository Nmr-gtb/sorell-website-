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
  { href: "/admin", label: "Dashboard", icon: DashboardIcon, group: "main" },
  { href: "/admin/users", label: "Utilisateurs", icon: UsersIcon, group: "main" },
  { href: "/admin/newsletters", label: "Newsletters", icon: MailIcon, group: "main" },
  { href: "/admin/lifecycle", label: "Lifecycle", icon: LifecycleIcon, group: "tools" },
  { href: "/admin/prompts", label: "Prompts", icon: BotIcon, group: "tools" },
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
    if (pathname.startsWith("/admin/users/")) return "Detail utilisateur";
    return "Admin";
  }

  if (!verified) {
    return (
      <div className="min-h-screen bg-[var(--surface-alt)] p-8">
        <SkeletonDashboard />
      </div>
    );
  }

  const mainNavItems = navItems.filter((i) => i.group === "main");
  const toolsNavItems = navItems.filter((i) => i.group === "tools");

  return (
    <div className="min-h-screen bg-[var(--surface-alt)] text-[var(--text)]">
      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 lg:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-xl p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
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
          className="rounded-xl p-2 text-[var(--text-secondary)] transition-colors hover:text-red-500"
          aria-label="Se deconnecter"
        >
          <LogoutIcon size={20} />
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:static lg:z-auto ${
            sidebarCollapsed ? "lg:w-[72px]" : "lg:w-[260px]"
          } ${sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0"}`}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-5">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)] shadow-[0_2px_8px_rgba(0,80,88,0.25)]">
                  <span className="text-sm font-bold text-white">S</span>
                </div>
                <div className="hidden lg:block">
                  <div
                    className="text-base font-bold text-[var(--text)]"
                    style={{ fontFamily: "'Quiglet', sans-serif" }}
                  >
                    Sorell
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    Admin Panel
                  </div>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)] shadow-[0_2px_8px_rgba(0,80,88,0.25)]">
                <span className="text-sm font-bold text-white">S</span>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)] lg:block"
              aria-label={sidebarCollapsed ? "Etendre le menu" : "Reduire le menu"}
            >
              {sidebarCollapsed ? <SidebarExpandIcon size={18} /> : <SidebarCollapseIcon size={18} />}
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {!sidebarCollapsed && (
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Principal
              </div>
            )}
            <div className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-[var(--accent)] text-white shadow-[0_2px_8px_rgba(0,80,88,0.3)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                    } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
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
            </div>

            {/* Separator */}
            <div className="my-4 border-t border-[var(--border)]" />

            {!sidebarCollapsed && (
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Outils
              </div>
            )}
            <div className="space-y-1">
              {toolsNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-[var(--accent)] text-white shadow-[0_2px_8px_rgba(0,80,88,0.3)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                    } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
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
            </div>
          </nav>

          {/* Bottom: user + logout */}
          <div className="border-t border-[var(--border)] p-3">
            <div className={`flex items-center gap-3 rounded-xl px-3 py-3 ${sidebarCollapsed ? "justify-center px-0" : ""}`}>
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-xs font-bold text-[var(--accent)]">
                N
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="truncate text-[13px] font-semibold text-[var(--text)]">Noe</div>
                  <div className="truncate text-[11px] text-[var(--text-muted)]">noe@sorell.fr</div>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[var(--text-secondary)] transition-all duration-150 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 ${
                sidebarCollapsed ? "justify-center px-0" : ""
              }`}
              aria-label="Se deconnecter"
            >
              <LogoutIcon size={18} className="flex-shrink-0" />
              {!sidebarCollapsed && <span>Deconnexion</span>}
            </button>
          </div>
        </aside>

        {/* Backdrop mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-h-screen min-w-0">
          {/* Top bar */}
          <div className="hidden lg:flex items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-8 py-4 sticky top-0 z-20">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--text-muted)]">Admin</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]"><path d="m9 18 6-6-6-6"/></svg>
                <span className="font-semibold text-[var(--text)]">{getBreadcrumb()}</span>
              </div>
            </div>

            {/* Search bar */}
            <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-2 min-w-[240px] transition-all duration-200 focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/10">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <span className="text-sm text-[var(--text-muted)]">Rechercher...</span>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-2">
              <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)]" aria-label="Notifications">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">3</span>
              </button>
              <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)]" aria-label="Messages">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </button>
              <div className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white shadow-[0_2px_8px_rgba(0,80,88,0.3)]">
                N
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8 animate-[fadeInUp_0.3s_ease-out]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
