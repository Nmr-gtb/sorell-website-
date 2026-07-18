export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      {/* Server Component (pas d'accès au contexte langue) : spinner seul,
          langue-neutre, avec label accessible pour les lecteurs d'écran. */}
      <div className="flex flex-col items-center gap-4" role="status" aria-label="Loading">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--border)]" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--accent)] animate-spin" />
        </div>
      </div>
    </div>
  );
}
