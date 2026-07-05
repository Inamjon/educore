"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { MONTHLY_REVENUE_DATA } from "@/lib/data";

export function FinanceRevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={MONTHLY_REVENUE_DATA} margin={{ top: 0, right: 0, bottom: 0, left: -20 }} barSize={20} barGap={6}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", fontSize: "12px" }}
          formatter={(v) => [formatCurrency(Number(v)), undefined]}
        />
        <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue" />
        <Bar dataKey="expenses" fill="#e0e7ff" radius={[4, 4, 0, 0]} name="Expenses" />
      </BarChart>
    </ResponsiveContainer>
  );
}
