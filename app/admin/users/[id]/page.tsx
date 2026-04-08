"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminCard from "@/components/admin/AdminCard";
import AdminButton from "@/components/admin/AdminButton";
import AdminTable from "@/components/admin/AdminTable";
import StatusBadge, { getPlanBadgeVariant, getStatusBadgeVariant } from "@/components/admin/StatusBadge";
import { AdminSelect } from "@/components/admin/AdminInput";
import { SkeletonDashboard } from "@/components/admin/Skeleton";
import {
  ArrowLeftIcon,
  TrashIcon,
  ExternalLinkIcon,
  AlertTriangleIcon,
} from "@/components/admin/AdminIcons";

interface UserDetail {
  profile: {
    id: string;
    email: string;
    full_name: string;
    plan: string;
    created_at: string;
    trial_ends_at: string | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    referral_code: string | null;
    referred_by: string | null;
  };
  config: {
    topics: string[];
    custom_topics: string[];
    custom_brief: string;
    sources: string;
    frequency: string;
    send_day: string;
    send_hour: number;
    recipients: unknown;
    brand_color: string;
  } | null;
  newsletters: {
    id: string;
    subject: string;
    status: string;
    created_at: string;
    sent_at: string | null;
    recipient_count: number;
    content: unknown;
  }[];
  totalSentCount: number;
  recipients: { id: string; email: string; created_at: string }[];
  lifecycleEmails: { email_type: string; sent_at: string }[];
  events: { newsletter_id: string; event_type: string; recipient_email: string; created_at: string }[];
  referrals: { id: string; code: string; status: string; created_at: string }[];
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};

const TAB_LIST = [
  { key: "overview", label: "Config" },
  { key: "newsletters", label: "Newsletters" },
  { key: "lifecycle", label: "Lifecycle" },
  { key: "events", label: "Events" },
] as const;

type TabKey = typeof TAB_LIST[number]["key"];

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editPlan, setEditPlan] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<TabKey>("overview");

  useEffect(() => {
    fetch(`/api/admin/users/${id}`, { credentials: "include" })
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setEditPlan(d.profile?.plan || "free");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handlePlanChange() {
    setSaving(true);
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: editPlan }),
      });
      setData((prev) => prev ? { ...prev, profile: { ...prev.profile, plan: editPlan } } : prev);
    } catch {
      // Error
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer cet utilisateur ? Cette action est irréversible.")) return;
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      router.push("/admin/users");
    } catch {
      // Error
    }
  }

  if (loading) return <SkeletonDashboard />;
  if (!data?.profile) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">
          Utilisateur non trouvé.
        </div>
      </div>
    );
  }

  const { profile, config, newsletters, recipients, lifecycleEmails, events } = data;

  return (
    <div className="space-y-6 animate-[fadeInUp_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-5">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
        >
          <ArrowLeftIcon size={16} />
          Retour
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-lg font-bold text-white shadow-[0_4px_12px_rgba(0,80,88,0.3)]">
            {(profile.full_name || profile.email)[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">{profile.full_name || profile.email}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-[var(--text-muted)]">{profile.email}</span>
              <StatusBadge
                label={PLAN_LABELS[profile.plan] || profile.plan}
                variant={getPlanBadgeVariant(profile.plan)}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Profile card */}
      <AdminCard>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <InfoField label="Email" value={profile.email} />
          <div>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">Plan</div>
            <div className="flex items-center gap-2">
              <AdminSelect
                value={editPlan}
                onChange={(e) => setEditPlan(e.target.value)}
                options={[
                  { value: "free", label: "Free" },
                  { value: "pro", label: "Pro" },
                  { value: "business", label: "Business" },
                  { value: "enterprise", label: "Enterprise" },
                ]}
                className="!w-auto"
              />
              {editPlan !== profile.plan && (
                <AdminButton
                  size="sm"
                  onClick={handlePlanChange}
                  loading={saving}
                >
                  Sauver
                </AdminButton>
              )}
            </div>
          </div>
          <InfoField
            label="Inscription"
            value={new Date(profile.created_at).toLocaleDateString("fr-FR")}
          />
          <InfoField
            label="Trial"
            value={
              profile.trial_ends_at
                ? new Date(profile.trial_ends_at).toLocaleDateString("fr-FR")
                : "\u2014"
            }
          />
          <InfoField
            label="Stripe ID"
            value={profile.stripe_customer_id || "\u2014"}
            mono
          />
          <InfoField
            label="Code parrainage"
            value={profile.referral_code || "\u2014"}
          />
          <InfoField
            label="Newsletters envoyées"
            value={String(data.totalSentCount ?? newsletters.filter((n) => n.status === "sent").length)}
          />
          <InfoField
            label="Destinataires"
            value={String(recipients.length)}
          />
        </div>
      </AdminCard>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1.5 w-fit shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {TAB_LIST.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 ${
              tab === t.key
                ? "bg-[var(--accent)] text-white shadow-[0_2px_8px_rgba(0,80,88,0.3)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && config && (
        <AdminCard>
          <h2 className="mb-5 text-base font-semibold text-[var(--text)]">Configuration Newsletter</h2>
          <div className="grid grid-cols-2 gap-5 text-sm">
            <InfoField
              label="Topics"
              value={[...(config.topics || []), ...(config.custom_topics || [])].map((t: unknown) => (typeof t === "string" ? t : (t as { label?: string })?.label || "")).filter(Boolean).join(", ") || "\u2014"}
            />
            <InfoField
              label="Fréquence"
              value={`${config.frequency || "\u2014"} - ${config.send_day || "\u2014"} à ${config.send_hour}h`}
            />
            <InfoField label="Sources" value={config.sources || "\u2014"} />
            <InfoField label="Couleur" value={config.brand_color || "défaut"} />
          </div>
          {config.custom_brief && (
            <div className="mt-5">
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">Brief custom</div>
              <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-4 text-sm text-[var(--text-muted)]">
                {config.custom_brief}
              </p>
            </div>
          )}
          <div className="mt-5">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">Destinataires</div>
            <div className="flex flex-wrap gap-2">
              {recipients.map((r) => (
                <span
                  key={r.id}
                  className="rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-2.5 py-1 text-xs text-[var(--text-muted)]"
                >
                  {r.email}
                </span>
              ))}
            </div>
          </div>
          <Link
            href={`/admin/prompts?userId=${id}`}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] transition-colors hover:underline"
          >
            <ExternalLinkIcon size={14} />
            Voir le prompt complet
          </Link>
        </AdminCard>
      )}

      {tab === "overview" && !config && (
        <AdminCard>
          <p className="text-sm text-[var(--text-secondary)]">Cet utilisateur n&apos;a pas encore configuré sa newsletter.</p>
        </AdminCard>
      )}

      {tab === "newsletters" && (
        <AdminTable
          columns={[
            {
              key: "subject",
              header: "Sujet",
              render: (nl) => (
                <span className="text-sm font-medium text-[var(--text)]">
                  {nl.subject || "Sans sujet"}
                </span>
              ),
            },
            {
              key: "status",
              header: "Statut",
              render: (nl) => (
                <StatusBadge
                  label={nl.status}
                  variant={getStatusBadgeVariant(nl.status)}
                />
              ),
            },
            {
              key: "recipients",
              header: "Destinataires",
              render: (nl) => (
                <span className="text-sm text-[var(--text-muted)]">{nl.recipient_count || 0}</span>
              ),
            },
            {
              key: "date",
              header: "Date",
              render: (nl) => (
                <span className="text-xs text-[var(--text-muted)]">
                  {nl.sent_at
                    ? new Date(nl.sent_at).toLocaleDateString("fr-FR")
                    : new Date(nl.created_at).toLocaleDateString("fr-FR")}
                </span>
              ),
            },
          ]}
          data={newsletters}
          keyExtractor={(nl) => nl.id}
          emptyMessage="Aucune newsletter."
        />
      )}

      {tab === "lifecycle" && (
        <AdminCard>
          <h2 className="mb-5 text-base font-semibold text-[var(--text)]">Timeline Lifecycle Emails</h2>
          {lifecycleEmails.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">Aucun email lifecycle envoyé.</p>
          ) : (
            <div className="relative space-y-0">
              {lifecycleEmails.map((le, i) => (
                <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Timeline line */}
                  {i < lifecycleEmails.length - 1 && (
                    <div className="absolute left-[7px] top-4 h-full w-px bg-[var(--border)]" />
                  )}
                  {/* Dot */}
                  <div className="relative z-10 mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center">
                    <div className="h-3 w-3 rounded-full bg-[var(--accent)] ring-4 ring-[var(--bg)]" />
                  </div>
                  {/* Content */}
                  <div className="flex flex-1 items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3">
                    <span className="text-sm font-medium text-[var(--text)]">{le.email_type}</span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {new Date(le.sent_at).toLocaleDateString("fr-FR")} à{" "}
                      {new Date(le.sent_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      )}

      {tab === "events" && (
        <AdminTable
          columns={[
            {
              key: "type",
              header: "Type",
              render: (e) => (
                <StatusBadge
                  label={e.event_type}
                  variant={getStatusBadgeVariant(e.event_type)}
                />
              ),
            },
            {
              key: "email",
              header: "Email destinataire",
              render: (e) => (
                <span className="text-sm text-[var(--text-muted)]">{e.recipient_email}</span>
              ),
            },
            {
              key: "date",
              header: "Date",
              render: (e) => (
                <span className="text-xs text-[var(--text-muted)]">
                  {new Date(e.created_at).toLocaleString("fr-FR")}
                </span>
              ),
            },
          ]}
          data={events}
          keyExtractor={(_, i) => String(i)}
          emptyMessage="Aucun événement."
        />
      )}

      {/* Danger zone */}
      <AdminCard variant="danger">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-50">
            <AlertTriangleIcon size={20} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-red-600">Zone dangereuse</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              La suppression est irréversible. Toutes les données seront perdues.
            </p>
            <AdminButton
              variant="danger"
              size="sm"
              onClick={handleDelete}
              icon={<TrashIcon size={14} />}
              className="mt-3"
            >
              Supprimer cet utilisateur
            </AdminButton>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}

function InfoField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
        {label}
      </div>
      <div
        className={`text-sm font-medium text-[var(--text)] ${mono ? "font-mono text-xs bg-[var(--surface-alt)] rounded-lg px-2 py-1 inline-block" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
