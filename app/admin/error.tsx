"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
          <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Une erreur est survenue
        </h2>
        <p className="max-w-sm text-sm text-[var(--text-secondary)]">
          Un probleme inattendu s&apos;est produit.
        </p>
        <button
          onClick={reset}
          className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          Reessayer
        </button>
      </div>
    </div>
  );
}
