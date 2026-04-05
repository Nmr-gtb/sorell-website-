"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminCard from "@/components/admin/AdminCard";
import AdminTable from "@/components/admin/AdminTable";
import StatusBadge, { getPlanBadgeVariant } from "@/components/admin/StatusBadge";
import { AdminSearchInput, AdminSelect } from "@/components/admin/AdminInput";
import AdminButton from "@/components/admin/AdminButton";
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon, UsersIcon } from "@/components/admin/AdminIcons";

interface User {
  id: string;
  email: string;
  full_name: string;
  plan: string;
  created_at: string;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  newsletters_sent: number;
  last_newsletter_at: string | null;
  recipient_count: number;
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (planFilter !== "all") params.set("plan", planFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, [page, planFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.ceil(total / 25);

  function getTrialStatus(user: User): string {
    if (user.plan !== "free" && user.plan !== "enterprise") {
      if (!user.trial_ends_at) return "";
      const trialEnd = new Date(user.trial_ends_at);
      const now = new Date();
      if (trialEnd > now) {
        const days = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return `Trial (${days}j)`;
      }
      return "Actif";
    }
    if (user.trial_ends_at) {
      const trialEnd = new Date(user.trial_ends_at);
      if (trialEnd < new Date()) return "Trial expiré";
    }
    return "";
  }

  return (
    <div className="space-y-10 animate-[fadeInUp_0.3s_ease-out]">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Utilisateurs</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Gérez et suivez tous vos utilisateurs</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-subtle)]">
            <UsersIcon size={18} className="text-[var(--accent)]" />
          </div>
          <div>
            <div className="text-xl font-bold text-[var(--text)]">{total}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">au total</div>
          </div>
        </div>
      </div>

      {/* Filters card */}
      <AdminCard padding="sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <AdminSearchInput
              placeholder="Rechercher par email ou nom..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <AdminSelect
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
            options={[
              { value: "all", label: "Tous les plans" },
              { value: "free", label: "Free" },
              { value: "pro", label: "Pro" },
              { value: "business", label: "Business" },
              { value: "enterprise", label: "Enterprise" },
            ]}
            className="sm:w-44"
          />
        </div>
      </AdminCard>

      {/* Table */}
      <AdminTable
        columns={[
          {
            key: "user",
            header: "Utilisateur",
            render: (user: User) => (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-xs font-bold text-[var(--accent)]">
                  {(user.full_name || user.email)[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--text)]">{user.full_name || "\u2014"}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{user.email}</div>
                </div>
              </div>
            ),
          },
          {
            key: "plan",
            header: "Plan",
            render: (user: User) => (
              <StatusBadge
                label={PLAN_LABELS[user.plan] || user.plan}
                variant={getPlanBadgeVariant(user.plan)}
              />
            ),
          },
          {
            key: "status",
            header: "Statut",
            render: (user: User) => {
              const status = getTrialStatus(user);
              if (!status) return <span className="text-xs text-[var(--text-secondary)]">{"\u2014"}</span>;
              const isExpired = status === "Trial expiré";
              return (
                <StatusBadge
                  label={status}
                  variant={isExpired ? "red" : status === "Actif" ? "green" : "amber"}
                />
              );
            },
          },
          {
            key: "newsletters",
            header: "Newsletters",
            render: (user: User) => (
              <span className="text-sm font-medium text-[var(--text)]">{user.newsletters_sent}</span>
            ),
          },
          {
            key: "recipients",
            header: "Destinataires",
            render: (user: User) => (
              <span className="text-sm font-medium text-[var(--text)]">{user.recipient_count}</span>
            ),
          },
          {
            key: "last_nl",
            header: "Dernière NL",
            render: (user: User) => (
              <span className="text-xs text-[var(--text-muted)]">
                {user.last_newsletter_at
                  ? new Date(user.last_newsletter_at).toLocaleDateString("fr-FR")
                  : "\u2014"}
              </span>
            ),
          },
          {
            key: "created",
            header: "Inscription",
            render: (user: User) => (
              <span className="text-xs text-[var(--text-muted)]">
                {new Date(user.created_at).toLocaleDateString("fr-FR")}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            render: (user: User) => (
              <Link
                href={`/admin/users/${user.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)]"
              >
                <EyeIcon size={14} />
                Détail
              </Link>
            ),
          },
        ]}
        data={users}
        keyExtractor={(user: User) => user.id}
        loading={loading}
        emptyMessage="Aucun utilisateur trouvé."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <AdminCard padding="sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-muted)]">
              {(page - 1) * 25 + 1}-{Math.min(page * 25, total)} sur {total} utilisateurs
            </span>
            <div className="flex items-center gap-3">
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                icon={<ChevronLeftIcon size={14} />}
              >
                Précédent
              </AdminButton>
              <span className="text-sm text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text)]">{page}</span> / {totalPages}
              </span>
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                icon={<ChevronRightIcon size={14} />}
              >
                Suivant
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
