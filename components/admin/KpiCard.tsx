import { type ReactNode } from "react";
import { TrendUpIcon, TrendDownIcon } from "./AdminIcons";

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean } | null;
  accent?: boolean;
}

export default function KpiCard({ icon, label, value, trend, accent = false }: KpiCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition-all duration-200 hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-md)]">
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(0,80,88,0.15)] text-[var(--accent)]"
        >
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              trend.positive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {trend.positive ? <TrendUpIcon size={14} /> : <TrendDownIcon size={14} />}
            {trend.value}
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.06em]">{label}</div>
        <div
          className={`mt-1.5 text-[26px] font-bold leading-tight tracking-tight ${
            accent ? "text-[var(--accent)]" : "text-[var(--text)]"
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
