"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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
  const totalUsers = pieData.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-6 shadow-[var(--shadow-sm)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signups chart */}
        <div className="lg:col-span-2">
          <h2 className="mb-5 text-[15px] font-semibold text-[var(--text)]">
            Inscriptions (30 derniers jours)
          </h2>
          <div className="rounded-xl bg-[var(--surface)] p-4">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={signupsChart}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0D9488" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#0D9488" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
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
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "10px",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
                    padding: "8px 12px",
                  }}
                  labelStyle={{ color: "#6B7280", fontSize: 12, marginBottom: 4 }}
                  itemStyle={{ color: "#0D9488", fontSize: 13, fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  fill="url(#areaGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#0D9488", stroke: "#FFFFFF", strokeWidth: 2.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan distribution */}
        <div>
          <h2 className="mb-5 text-[15px] font-semibold text-[var(--text)]">
            Répartition des plans
          </h2>
          <div className="rounded-xl bg-[var(--surface)] p-4">
            <div className="relative flex items-center justify-center" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={52}
                    strokeWidth={3}
                    stroke="#FFFFFF"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                      borderRadius: "10px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
                      padding: "8px 12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center total */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--text)]">{totalUsers}</div>
                  <div className="text-[10px] text-[var(--text-muted)] font-medium tracking-wide">total</div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
              {pieData.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <span>{p.name}: {p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
