"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminTable from "@/components/admin/AdminTable";
import StatusBadge, { getPlanBadgeVariant } from "@/components/admin/StatusBadge";
import { AdminSearchInput, AdminSelect } from "@/components/admin/AdminInput";
import AdminButton from "@/components/admin/AdminButton";
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon } from "@/components/admin/AdminIcons";

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
    <div className="space-y-6 animate-[fadeInUp_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text)]">Utilisateurs</h1>
        <span className="rounded-full bg-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--text-muted)]">
          {total} au total
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
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

      {/* Table */}
      <AdminTable
        columns={[
          {
            key: "user",
            header: "Utilisateur",
            render: (user: User) => (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-xs font-bold text-[var(--accent)]">
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
              if (!status) return <span className="text-xs text-[var(--text-secondary)]">\u2014</span>;
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
            header: "Actions",
            render: (user: User) => (
              <Link
                href={`/admin/users/${user.id}`}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent-subtle)]"
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
        <div className="flex items-center justify-center gap-3">
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
            Page <span className="font-medium text-[var(--text-muted)]">{page}</span> / {totalPages}
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
      )}
    </div>
  );
}
