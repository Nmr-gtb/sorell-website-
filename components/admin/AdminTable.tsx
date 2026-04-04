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
    <div className="overflow-hidden rounded-xl border border-[#2A2D38] bg-[#1A1C25]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A2D38]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280] ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2D38]/50">
            {loading
              ? Array.from({ length: loadingRows }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3.5">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-[#2A2D38]" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-12 text-center text-[#6B7280]"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => (
                    <tr
                      key={keyExtractor(item, index)}
                      className={`transition-colors duration-100 hover:bg-[#1E2030] ${
                        onRowClick ? "cursor-pointer" : ""
                      }`}
                      onClick={() => onRowClick?.(item)}
                    >
                      {columns.map((col) => (
                        <td key={col.key} className={`px-4 py-3.5 ${col.className || ""}`}>
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
