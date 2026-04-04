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
      <div className="min-h-screen bg-[#0F1117] p-8">
        <SkeletonDashboard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1117] text-[#F3F4F6]">
      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-[#2A2D38] bg-[#1A1C25] px-4 py-3 lg:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-1.5 text-[#9CA3AF] transition-colors hover:bg-[#2A2D38] hover:text-[#F3F4F6]"
          aria-label="Ouvrir le menu"
        >
          <MenuIcon size={22} />
        </button>
        <span
          className="text-lg font-bold text-[#F3F4F6]"
          style={{ fontFamily: "'Quiglet', sans-serif" }}
        >
          Sorell
        </span>
        <button
          onClick={handleLogout}
          className="rounded-lg p-1.5 text-[#6B7280] transition-colors hover:text-red-400"
          aria-label="Se déconnecter"
        >
          <LogoutIcon size={20} />
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#2A2D38] bg-[#161820] transition-all duration-300 lg:static lg:z-auto ${
            sidebarCollapsed ? "lg:w-[72px]" : "lg:w-64"
          } ${sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0"}`}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b border-[#2A2D38] px-4 py-5">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10">
                  <span className="text-sm font-bold text-teal-400">N</span>
                </div>
                <div className="hidden lg:block">
                  <div
                    className="text-base font-bold text-[#F3F4F6]"
                    style={{ fontFamily: "'Quiglet', sans-serif" }}
                  >
                    Sorell
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-widest text-[#6B7280]">
                    Admin
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden rounded-lg p-1 text-[#6B7280] transition-colors hover:bg-[#2A2D38] hover:text-[#9CA3AF] lg:block"
              aria-label={sidebarCollapsed ? "Étendre le menu" : "Réduire le menu"}
            >
              {sidebarCollapsed ? <SidebarExpandIcon size={18} /> : <SidebarCollapseIcon size={18} />}
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-teal-500/10 text-teal-400"
                      : "text-[#9CA3AF] hover:bg-[#1E2030] hover:text-[#F3F4F6]"
                  } ${sidebarCollapsed ? "justify-center" : ""}`}
                  title={sidebarCollapsed ? item.label : undefined}
                  aria-label={item.label}
                >
                  <Icon
                    size={20}
                    className={`flex-shrink-0 transition-colors ${
                      isActive ? "text-teal-400" : "text-[#6B7280] group-hover:text-[#9CA3AF]"
                    }`}
                  />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-[#2A2D38] px-3 py-4">
            <button
              onClick={handleLogout}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#6B7280] transition-all duration-150 hover:bg-red-500/10 hover:text-red-400 ${
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
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-h-screen">
          {/* Breadcrumb header */}
          <div className="hidden lg:flex items-center gap-2 border-b border-[#2A2D38] bg-[#161820]/50 px-8 py-3">
            <span className="text-xs text-[#6B7280]">Admin</span>
            <span className="text-xs text-[#3A3D4A]">/</span>
            <span className="text-xs font-medium text-[#9CA3AF]">{getBreadcrumb()}</span>
          </div>
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
