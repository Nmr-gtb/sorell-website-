"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AdminCard from "@/components/admin/AdminCard";
import { AdminSelect } from "@/components/admin/AdminInput";
import StatusBadge, { getPlanBadgeVariant } from "@/components/admin/StatusBadge";
import { SkeletonTable } from "@/components/admin/Skeleton";
import AdminButton from "@/components/admin/AdminButton";
import { CopyIcon, CheckIcon, BotIcon } from "@/components/admin/AdminIcons";

interface PromptData {
  profile: { id: string; email: string; full_name: string; plan: string };
  config: {
    topics: string[];
    custom_topics: string[];
    custom_brief: string;
    sources: string;
    frequency: string;
  } | null;
  prompt: string | null;
  previousTitles: string[];
  lastGeneration: {
    id: string;
    subject: string;
    content: unknown;
    created_at: string;
  } | null;
  message?: string;
}

interface UserEntry {
  id: string;
  email: string;
  full_name: string;
}

export default function AdminPromptsPage() {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("userId") || "";

  const [users, setUsers] = useState<UserEntry[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(initialUserId);
  const [promptData, setPromptData] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [copied, setCopied] = useState(false);

  // Load user list
  useEffect(() => {
    fetch("/api/admin/users?limit=100", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setUsers((data.users || []).map((u: UserEntry) => ({ id: u.id, email: u.email, full_name: u.full_name })));
      })
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  }, []);

  // Load prompt for selected user
  useEffect(() => {
    if (!selectedUserId) {
      setPromptData(null);
      return;
    }
    setLoading(true);
    fetch(`/api/admin/prompts/${selectedUserId}`, { credentials: "include" })
      .then((res) => res.json())
      .then(setPromptData)
      .catch(() => setPromptData(null))
      .finally(() => setLoading(false));
  }, [selectedUserId]);

  async function handleCopyPrompt() {
    if (!promptData?.prompt) return;
    try {
      await navigator.clipboard.writeText(promptData.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  }

  return (
    <div className="space-y-6 animate-[fadeInUp_0.3s_ease-out]">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Prompts Utilisateurs</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Visualisez le prompt système reconstruit pour chaque utilisateur</p>
      </div>

      {/* User selector */}
      <AdminCard padding="md">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)]">
            <BotIcon size={18} className="text-[var(--accent)]" />
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Sélectionner un utilisateur
            </label>
            {loadingUsers ? (
              <div className="h-9 w-full max-w-md animate-pulse rounded-lg bg-[var(--border)]" />
            ) : (
              <AdminSelect
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                options={[
                  { value: "", label: "-- Choisir un utilisateur --" },
                  ...users.map((u) => ({
                    value: u.id,
                    label: `${u.full_name || u.email} (${u.email})`,
                  })),
                ]}
                className="max-w-md"
              />
            )}
          </div>
        </div>
      </AdminCard>

      {loading && <SkeletonTable rows={3} cols={2} />}

      {promptData && !loading && (
        <div className="space-y-6">
          {/* User info card */}
          <AdminCard padding="md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-base font-bold text-[var(--accent)]">
                {(promptData.profile.full_name || promptData.profile.email)[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-[var(--text)]">
                  {promptData.profile.full_name || promptData.profile.email}
                </div>
                <div className="mt-0.5 flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                  {promptData.profile.email}
                  <StatusBadge
                    label={promptData.profile.plan}
                    variant={getPlanBadgeVariant(promptData.profile.plan)}
                  />
                </div>
              </div>
            </div>
          </AdminCard>

          {promptData.message && !promptData.config && (
            <AdminCard variant="accent" padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100">
                  <span className="text-sm">&#9888;</span>
                </div>
                <p className="text-sm text-yellow-700">{promptData.message}</p>
              </div>
            </AdminCard>
          )}

          {/* Config summary */}
          {promptData.config && (
            <AdminCard padding="md">
              <h2 className="mb-6 text-base font-semibold text-[var(--text)]">Configuration</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-alt)] p-5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Topics</span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[...(promptData.config.topics || []), ...(promptData.config.custom_topics || [])].map((topic, i) => (
                      <span key={i} className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                        {typeof topic === "string" ? topic : (topic as { label?: string })?.label || ""}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-alt)] p-5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Sources</span>
                  <p className="mt-2 text-sm text-[var(--text)]">{promptData.config.sources || "Aucune"}</p>
                </div>
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-alt)] p-5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Fréquence</span>
                  <p className="mt-2 text-sm font-medium text-[var(--text)]">{promptData.config.frequency}</p>
                </div>
                {promptData.config.custom_brief && (
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-alt)] p-5 sm:col-span-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Brief</span>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">{promptData.config.custom_brief}</p>
                  </div>
                )}
              </div>
            </AdminCard>
          )}

          {/* Full prompt */}
          {promptData.prompt && (
            <AdminCard padding="md">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[var(--text)]">
                  Prompt complet
                </h2>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyPrompt}
                  icon={copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                >
                  {copied ? "Copié !" : "Copier"}
                </AdminButton>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-[#2A2D38] bg-[#1A1C25]">
                <div className="flex items-center gap-2 border-b border-[#2A2D38] px-4 py-2.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#EF4444]/30" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]/30" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#10B981]/30" />
                  <span className="ml-2 text-[10px] font-medium text-[#6B7280]">system-prompt.txt</span>
                </div>
                <pre className="max-h-[500px] overflow-y-auto p-6 text-[13px] leading-relaxed text-[#D1D5DB] whitespace-pre-wrap font-mono">
                  {promptData.prompt}
                </pre>
              </div>
            </AdminCard>
          )}

          {/* Previous titles */}
          {promptData.previousTitles && promptData.previousTitles.length > 0 && (
            <AdminCard padding="md">
              <h2 className="mb-4 text-base font-semibold text-[var(--text)]">
                Titres précédents <span className="text-sm font-normal text-[var(--text-muted)]">(anti-duplication)</span>
              </h2>
              <div className="space-y-2">
                {promptData.previousTitles.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3"
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-[10px] font-bold text-[var(--accent)]">
                      {i + 1}
                    </span>
                    <span className="text-sm text-[var(--text)]">{t}</span>
                  </div>
                ))}
              </div>
            </AdminCard>
          )}

          {/* Last generation */}
          {promptData.lastGeneration && (
            <AdminCard padding="md">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[var(--text)]">Dernière génération</h2>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-1 text-xs text-[var(--text-muted)]">
                  {new Date(promptData.lastGeneration.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Sujet</span>
                <p className="mt-1 text-sm font-medium text-[var(--text)]">{promptData.lastGeneration.subject}</p>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-[#2A2D38] bg-[#1A1C25]">
                <div className="flex items-center gap-2 border-b border-[#2A2D38] px-4 py-2.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#EF4444]/30" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]/30" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#10B981]/30" />
                  <span className="ml-2 text-[10px] font-medium text-[#6B7280]">output.json</span>
                </div>
                <pre className="max-h-[400px] overflow-y-auto p-6 text-[13px] leading-relaxed text-[#D1D5DB] whitespace-pre-wrap font-mono">
                  {typeof promptData.lastGeneration.content === "string"
                    ? promptData.lastGeneration.content
                    : JSON.stringify(promptData.lastGeneration.content, null, 2)}
                </pre>
              </div>
            </AdminCard>
          )}
        </div>
      )}

      {/* Empty state */}
      {!selectedUserId && !loading && (
        <AdminCard className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)]">
            <BotIcon size={28} className="text-[var(--text-muted)]" />
          </div>
          <h3 className="mt-5 text-sm font-semibold text-[var(--text)]">Aucun utilisateur sélectionné</h3>
          <p className="mt-1.5 max-w-xs text-center text-sm text-[var(--text-muted)]">
            Sélectionnez un utilisateur ci-dessus pour voir son prompt de génération et sa dernière newsletter.
          </p>
        </AdminCard>
      )}
    </div>
  );
}
