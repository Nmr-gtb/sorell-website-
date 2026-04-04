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
    <div className="group relative overflow-hidden rounded-xl border border-[#2A2D38] bg-[#1A1C25] p-5 transition-all duration-200 hover:border-[#3A3D4A] hover:bg-[#1E2030]">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            accent ? "bg-teal-500/10 text-teal-400" : "bg-[#2A2D38] text-[#9CA3AF]"
          }`}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              trend.positive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {trend.positive ? <TrendUpIcon size={14} /> : <TrendDownIcon size={14} />}
            {trend.value}
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">{label}</div>
        <div
          className={`mt-1 text-2xl font-bold tracking-tight ${
            accent ? "text-teal-400" : "text-[#F3F4F6]"
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
