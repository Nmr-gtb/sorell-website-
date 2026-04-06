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
    <div className="group relative overflow-hidden rounded-[20px] border border-[#E8ECF1] bg-white px-7 py-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-[var(--border-hover)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">{label}</div>
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
      <div className="mt-4 flex items-center gap-3">
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${iconBg || "bg-[#E6F0F1]"} ${iconColor || "text-[#005058]"}`}
        >
          {icon}
        </div>
        <div
          className={`text-[32px] font-bold leading-tight tracking-tight ${
            accent ? "text-[#005058]" : "text-[#111827]"
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
