"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AdminCard from "@/components/admin/AdminCard";
import { AdminSelect } from "@/components/admin/AdminInput";
import StatusBadge, { getPlanBadgeVariant } from "@/components/admin/StatusBadge";
import { SkeletonTable } from "@/components/admin/Skeleton";
import AdminButton from "@/components/admin/AdminButton";
import { CopyIcon, CheckIcon } from "@/components/admin/AdminIcons";

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
      <h1 className="text-2xl font-bold text-[#111827]">Prompts Utilisateurs</h1>

      {/* User selector */}
      <AdminCard padding="sm">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6B7280]">Utilisateur :</span>
          {loadingUsers ? (
            <div className="h-9 w-64 animate-pulse rounded-lg bg-[#E5E7EB]" />
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
              className="max-w-md flex-1"
            />
          )}
        </div>
      </AdminCard>

      {loading && <SkeletonTable rows={3} cols={2} />}

      {promptData && !loading && (
        <div className="space-y-6">
          {/* User info */}
          <AdminCard padding="sm">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#005058]/8 text-sm font-bold text-[#005058]">
                {(promptData.profile.full_name || promptData.profile.email)[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[#111827]">
                  {promptData.profile.full_name || promptData.profile.email}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#6B7280]">
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
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm text-yellow-600">
              {promptData.message}
            </div>
          )}

          {/* Config summary */}
          {promptData.config && (
            <AdminCard>
              <h2 className="mb-4 text-base font-semibold text-[#111827]">Configuration</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Topics</span>
                  <p className="mt-1 text-[#111827]">
                    {[...(promptData.config.topics || []), ...(promptData.config.custom_topics || [])].join(", ")}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Sources</span>
                  <p className="mt-1 text-[#111827]">{promptData.config.sources || "Aucune"}</p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Fréquence</span>
                  <p className="mt-1 text-[#111827]">{promptData.config.frequency}</p>
                </div>
                {promptData.config.custom_brief && (
                  <div className="col-span-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Brief</span>
                    <p className="mt-1 text-[#111827]">{promptData.config.custom_brief}</p>
                  </div>
                )}
              </div>
            </AdminCard>
          )}

          {/* Full prompt */}
          {promptData.prompt && (
            <AdminCard>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#111827]">
                  Prompt complet (envoyé à Claude)
                </h2>
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPrompt}
                  icon={copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                >
                  {copied ? "Copié" : "Copier"}
                </AdminButton>
              </div>
              <div className="relative overflow-hidden rounded-lg border border-[#334155] bg-[#1E293B]">
                <div className="flex items-center gap-2 border-b border-[#334155] px-4 py-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/40" />
                  <span className="ml-2 text-[10px] text-[#94A3B8]">system-prompt.txt</span>
                </div>
                <pre className="max-h-[500px] overflow-y-auto p-4 text-xs leading-relaxed text-[#CBD5E1] whitespace-pre-wrap">
                  {promptData.prompt}
                </pre>
              </div>
            </AdminCard>
          )}

          {/* Previous titles */}
          {promptData.previousTitles && promptData.previousTitles.length > 0 && (
            <AdminCard>
              <h2 className="mb-4 text-base font-semibold text-[#111827]">
                Titres précédents (anti-duplication)
              </h2>
              <ul className="space-y-2">
                {promptData.previousTitles.map((t, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#9CA3AF]"
                  >
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-[#E5E7EB] text-[10px] font-bold text-[#6B7280]">
                      {i + 1}
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </AdminCard>
          )}

          {/* Last generation */}
          {promptData.lastGeneration && (
            <AdminCard>
              <h2 className="mb-4 text-base font-semibold text-[#111827]">Dernière génération</h2>
              <div className="mb-3 flex items-center gap-3 text-sm">
                <span className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">Sujet</span>
                <span className="text-[#111827]">{promptData.lastGeneration.subject}</span>
                <span className="text-xs text-[#6B7280]">
                  ({new Date(promptData.lastGeneration.created_at).toLocaleDateString("fr-FR")})
                </span>
              </div>
              <div className="relative overflow-hidden rounded-lg border border-[#334155] bg-[#1E293B]">
                <div className="flex items-center gap-2 border-b border-[#334155] px-4 py-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/40" />
                  <span className="ml-2 text-[10px] text-[#94A3B8]">output.json</span>
                </div>
                <pre className="max-h-[400px] overflow-y-auto p-4 text-xs leading-relaxed text-[#CBD5E1] whitespace-pre-wrap">
                  {typeof promptData.lastGeneration.content === "string"
                    ? promptData.lastGeneration.content
                    : JSON.stringify(promptData.lastGeneration.content, null, 2)}
                </pre>
              </div>
            </AdminCard>
          )}
        </div>
      )}

      {!selectedUserId && !loading && (
        <AdminCard className="flex flex-col items-center justify-center py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#F3F4F6]">
            <svg
              className="h-6 w-6 text-[#6B7280]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8V4H8M12 8V4h4M12 8v4m0 4v4m0-4H8m4 0h4"
              />
            </svg>
          </div>
          <p className="mt-4 text-sm text-[#6B7280]">
            Sélectionne un utilisateur pour voir son prompt de génération.
          </p>
        </AdminCard>
      )}
    </div>
  );
}
