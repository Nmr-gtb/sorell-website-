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
import { BorderBeam } from "@/components/ui/border-beam";

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
  "/admin/lifecycle/workflow": "Workflow Visuel",
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
    <div className="min-h-screen bg-[#FAFBFC] text-[var(--text)]">
      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-white/80 backdrop-blur-xl px-4 py-3 lg:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
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
          className="rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:text-red-500"
          aria-label="Se deconnecter"
        >
          <LogoutIcon size={20} />
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-[#E8EAED] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:static lg:z-auto ${
            sidebarCollapsed ? "lg:w-[72px]" : "lg:w-[264px]"
          } ${sidebarOpen ? "w-[264px] translate-x-0 shadow-2xl shadow-black/10" : "w-[264px] -translate-x-full lg:translate-x-0"}`}
        >
          {/* Sidebar header with border beam */}
          <div className="relative border-b border-[#E8EAED] px-5 py-5 overflow-hidden">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#005058] to-[#0D9488] shadow-[0_4px_12px_rgba(0,80,88,0.3)]">
                    <span className="text-sm font-bold text-white">S.</span>
                  </div>
                  <div className="hidden lg:block">
                    <div
                      className="text-base font-bold text-[var(--text)] tracking-tight"
                      style={{ fontFamily: "'Quiglet', sans-serif" }}
                    >
                      Sorell
                    </div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--text-muted)]">
                      Admin Panel
                    </div>
                  </div>
                </div>
              )}
              {sidebarCollapsed && (
                <div className="mx-auto relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#005058] to-[#0D9488] shadow-[0_4px_12px_rgba(0,80,88,0.3)]">
                  <span className="text-sm font-bold text-white">S.</span>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden rounded-lg p-1.5 text-[var(--text-muted)] transition-all duration-200 hover:bg-[#F3F4F6] hover:text-[var(--text-secondary)] lg:block"
                aria-label={sidebarCollapsed ? "Etendre le menu" : "Reduire le menu"}
              >
                {sidebarCollapsed ? <SidebarExpandIcon size={18} /> : <SidebarCollapseIcon size={18} />}
              </button>
            </div>
            <BorderBeam size={120} duration={8} borderWidth={1.5} colorFrom="#005058" colorTo="#5EEAD4" delay={0} />
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto px-3 py-5">
            {!sidebarCollapsed && (
              <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Principal
              </div>
            )}
            <div className="space-y-0.5">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-[#005058] text-white shadow-[0_1px_3px_rgba(0,80,88,0.4),0_4px_12px_rgba(0,80,88,0.15)]"
                        : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#374151]"
                    } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
                    title={sidebarCollapsed ? item.label : undefined}
                    aria-label={item.label}
                  >
                    {isActive && !sidebarCollapsed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#5EEAD4]" />
                    )}
                    <Icon
                      size={19}
                      className={`flex-shrink-0 transition-colors duration-200 ${
                        isActive ? "text-white" : "text-[#9CA3AF] group-hover:text-[#6B7280]"
                      }`}
                    />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Separator */}
            <div className="my-5 mx-3 border-t border-[#F0F1F3]" />

            {!sidebarCollapsed && (
              <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Outils
              </div>
            )}
            <div className="space-y-0.5">
              {toolsNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-[#005058] text-white shadow-[0_1px_3px_rgba(0,80,88,0.4),0_4px_12px_rgba(0,80,88,0.15)]"
                        : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#374151]"
                    } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
                    title={sidebarCollapsed ? item.label : undefined}
                    aria-label={item.label}
                  >
                    {isActive && !sidebarCollapsed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#5EEAD4]" />
                    )}
                    <Icon
                      size={19}
                      className={`flex-shrink-0 transition-colors duration-200 ${
                        isActive ? "text-white" : "text-[#9CA3AF] group-hover:text-[#6B7280]"
                      }`}
                    />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Bottom: user + logout */}
          <div className="border-t border-[#E8EAED] p-3">
            {/* User card */}
            <div className={`flex items-center gap-3 rounded-lg px-3 py-3 ${sidebarCollapsed ? "justify-center px-0" : ""}`}>
              <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#005058] to-[#0D9488] text-xs font-bold text-white shadow-[0_2px_8px_rgba(0,80,88,0.2)]">
                N
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
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
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[#9CA3AF] transition-all duration-200 hover:bg-red-50 hover:text-red-500 ${
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
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-h-screen min-w-0">
          {/* Top bar */}
          <div className="hidden lg:flex items-center gap-4 border-b border-[#E8EAED] bg-white/80 backdrop-blur-xl px-8 py-4 sticky top-0 z-20">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--text-muted)]">Admin</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#D1D5DB]"><path d="m9 18 6-6-6-6"/></svg>
                <span className="font-semibold text-[var(--text)]">{getBreadcrumb()}</span>
              </div>
            </div>

            {/* Search bar */}
            <div className="flex items-center gap-2.5 rounded-lg border border-[#E8EAED] bg-[#F9FAFB] px-4 py-2 min-w-[260px] transition-all duration-200 focus-within:border-[#005058] focus-within:ring-2 focus-within:ring-[#005058]/8 focus-within:bg-white">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <span className="text-sm text-[var(--text-muted)]">Rechercher...</span>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-2">
              <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8EAED] bg-white text-[#9CA3AF] transition-all duration-200 hover:bg-[#F3F4F6] hover:text-[#6B7280] hover:border-[#D1D5DB]" aria-label="Notifications">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">3</span>
              </button>
              <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8EAED] bg-white text-[#9CA3AF] transition-all duration-200 hover:bg-[#F3F4F6] hover:text-[#6B7280] hover:border-[#D1D5DB]" aria-label="Messages">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </button>
              <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#005058] to-[#0D9488] text-xs font-bold text-white shadow-[0_2px_8px_rgba(0,80,88,0.25)]">
                N
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8 animate-[pageFadeIn_0.3s_ease-out]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
