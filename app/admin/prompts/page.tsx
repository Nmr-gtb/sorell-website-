"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Prompts Utilisateurs</h1>

      {/* User selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-400">Sélectionner un utilisateur :</label>
        {loadingUsers ? (
          <span className="text-gray-500 text-sm">Chargement...</span>
        ) : (
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="flex-1 max-w-md px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">-- Choisir --</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name || u.email} ({u.email})
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && <div className="text-gray-400 text-sm">Chargement du prompt...</div>}

      {promptData && !loading && (
        <div className="space-y-6">
          {/* User info */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300">
              {(promptData.profile.full_name || promptData.profile.email)[0].toUpperCase()}
            </div>
            <div>
              <div className="text-white font-medium">{promptData.profile.full_name || promptData.profile.email}</div>
              <div className="text-gray-500 text-xs">{promptData.profile.email} — {promptData.profile.plan}</div>
            </div>
          </div>

          {promptData.message && !promptData.config && (
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4 text-yellow-300 text-sm">
              {promptData.message}
            </div>
          )}

          {/* Config summary */}
          {promptData.config && (
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-3">Configuration</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Topics : </span>
                  <span className="text-white">{[...(promptData.config.topics || []), ...(promptData.config.custom_topics || [])].join(", ")}</span>
                </div>
                <div>
                  <span className="text-gray-500">Sources : </span>
                  <span className="text-white">{promptData.config.sources || "Aucune"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Fréquence : </span>
                  <span className="text-white">{promptData.config.frequency}</span>
                </div>
                {promptData.config.custom_brief && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Brief : </span>
                    <span className="text-white">{promptData.config.custom_brief}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full prompt */}
          {promptData.prompt && (
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-3">Prompt complet (envoyé à Claude)</h2>
              <pre className="bg-gray-950 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-[500px] overflow-y-auto border border-gray-800">
                {promptData.prompt}
              </pre>
            </div>
          )}

          {/* Previous titles (anti-duplication) */}
          {promptData.previousTitles && promptData.previousTitles.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-3">Titres précédents (anti-duplication)</h2>
              <ul className="space-y-1">
                {promptData.previousTitles.map((t, i) => (
                  <li key={i} className="text-sm text-gray-400">• {t}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Last generation */}
          {promptData.lastGeneration && (
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-3">Dernière génération</h2>
              <div className="text-sm text-gray-400 mb-2">
                <span className="text-gray-500">Sujet : </span>
                <span className="text-white">{promptData.lastGeneration.subject}</span>
                <span className="text-gray-600 ml-2">
                  ({new Date(promptData.lastGeneration.created_at).toLocaleDateString("fr-FR")})
                </span>
              </div>
              <pre className="bg-gray-950 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-[400px] overflow-y-auto border border-gray-800">
                {typeof promptData.lastGeneration.content === "string"
                  ? promptData.lastGeneration.content
                  : JSON.stringify(promptData.lastGeneration.content, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {!selectedUserId && !loading && (
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
          <p className="text-gray-500">Sélectionne un utilisateur pour voir son prompt de génération.</p>
        </div>
      )}
    </div>
  );
}
