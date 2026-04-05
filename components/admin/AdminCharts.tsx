"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import AdminCard from "@/components/admin/AdminCard";

interface PieDataEntry {
  name: string;
  value: number;
  color: string;
}

interface AdminChartsProps {
  signupsChart: { date: string; count: number }[];
  pieData: PieDataEntry[];
}

export default function AdminCharts({ signupsChart, pieData }: AdminChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Signups chart */}
      <AdminCard className="lg:col-span-2">
        <h2 className="mb-5 text-base font-semibold text-[var(--text)]">
          Inscriptions (30 derniers jours)
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={signupsChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              tickFormatter={(d: string) => d.slice(5)}
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={false}
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.07)",
              }}
              labelStyle={{ color: "var(--text-secondary)", fontSize: 12 }}
              itemStyle={{ color: "var(--accent)", fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#0D9488"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#0D9488", stroke: "#FFFFFF", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </AdminCard>

      {/* Plan distribution */}
      <AdminCard>
        <h2 className="mb-5 text-base font-semibold text-[var(--text)]">
          Repartition des plans
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={45}
              strokeWidth={0}
              label={({ name, value }: { name?: string; value?: number }) => `${name ?? ""}: ${value ?? 0}`}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 flex flex-wrap gap-3">
          {pieData.map((p) => (
            <div key={p.name} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {p.name}: {p.value}
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
