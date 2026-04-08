import { type ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => ReactNode;
  className?: string;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  emptyMessage?: string;
  loadingRows?: number;
  onRowClick?: (item: T) => void;
}

export default function AdminTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = "Aucune donnee.",
  loadingRows = 5,
  onRowClick,
}: AdminTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] first:pl-12 last:pr-12 ${col.className || ""}`}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="opacity-30">
                      <path d="M4 1L6.5 3.5H1.5L4 1Z" fill="currentColor" />
                      <path d="M4 7L1.5 4.5H6.5L4 7Z" fill="currentColor" />
                    </svg>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: loadingRows }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className={i % 2 === 1 ? "bg-[var(--surface-alt)]/30" : ""}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-5 first:pl-12 last:pr-12">
                        <div className="h-4 w-3/4 animate-pulse rounded-md bg-[var(--border)]" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-16 text-center text-sm text-[var(--text-muted)]"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => (
                    <tr
                      key={keyExtractor(item, index)}
                      className={`border-b border-[var(--border)]/50 last:border-0 transition-colors duration-150 hover:bg-[var(--surface-alt)] ${
                        index % 2 === 1 ? "bg-[var(--surface-alt)]/30" : ""
                      } ${onRowClick ? "cursor-pointer" : ""}`}
                      onClick={() => onRowClick?.(item)}
                    >
                      {columns.map((col) => (
                        <td key={col.key} className={`px-6 py-4 first:pl-12 last:pr-12 ${col.className || ""}`}>
                          {col.render(item, index)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
