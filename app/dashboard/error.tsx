"use client";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Une erreur est survenue
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Un problème inattendu s&apos;est produit. Veuillez réessayer.
        </p>
        <button
          onClick={reset}
          className="mt-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
          style={{ backgroundColor: "#005058" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#006068")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#005058")
          }
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
