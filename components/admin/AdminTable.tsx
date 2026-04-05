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
  emptyMessage = "Aucune donnée.",
  loadingRows = 5,
  onRowClick,
}: AdminTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)] ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {loading
              ? Array.from({ length: loadingRows }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-5">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--border)]" />
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
                      className={`transition-colors duration-100 hover:bg-[var(--surface-alt)] ${
                        onRowClick ? "cursor-pointer" : ""
                      }`}
                      onClick={() => onRowClick?.(item)}
                    >
                      {columns.map((col) => (
                        <td key={col.key} className={`px-6 py-5 ${col.className || ""}`}>
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
