"use client";

import { useLanguage } from "@/lib/LanguageContext";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
        <div className="w-12 h-12 rounded-full bg-[var(--error-bg)] flex items-center justify-center">
          <svg
            className="w-6 h-6 text-[var(--error)]"
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
        <h2 className="text-lg font-semibold text-[var(--text)]">
          {t("dashboard.error_title")}
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {t("dashboard.error_desc")}
        </p>
        <button
          onClick={reset}
          className="mt-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)]"
        >
          {t("common.retry")}
        </button>
      </div>
    </div>
  );
}
