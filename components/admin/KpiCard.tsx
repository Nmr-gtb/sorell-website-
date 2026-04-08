import { type ReactNode } from "react";
import { TrendUpIcon, TrendDownIcon } from "./AdminIcons";

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean } | null;
  accent?: boolean;
  iconBg?: string;
  iconColor?: string;
}

export default function KpiCard({ icon, label, value, trend, accent = false, iconBg, iconColor }: KpiCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-6 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-[var(--border-hover)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${iconBg || "bg-[#E6F0F1]"} ${iconColor || "text-[#005058]"}`}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              trend.positive
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
            }`}
          >
            {trend.positive ? <TrendUpIcon size={12} /> : <TrendDownIcon size={12} />}
            {trend.value}
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">{label}</div>
        <div
          className={`mt-1 text-[28px] font-bold leading-tight tracking-tight ${
            accent ? "text-[var(--accent)]" : "text-[var(--text)]"
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
