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
    <div className="group relative overflow-hidden rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-[#D1D5DB] hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.07)]">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            accent ? "bg-[#005058]/8 text-[#005058]" : "bg-[#F3F4F6] text-[#6B7280]"
          }`}
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
        <div className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-[0.05em]">{label}</div>
        <div
          className={`mt-1 text-2xl font-bold tracking-tight ${
            accent ? "text-[#005058]" : "text-[#111827]"
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
