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
    <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.05em] text-[#9CA3AF] ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {loading
              ? Array.from({ length: loadingRows }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3.5">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-[#E5E7EB]" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-12 text-center text-[#9CA3AF]"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => (
                    <tr
                      key={keyExtractor(item, index)}
                      className={`transition-colors duration-100 hover:bg-[#F9FAFB] ${
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
