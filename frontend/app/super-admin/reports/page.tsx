'use client';

import { useState } from 'react';
import { Download, DollarSign, Users, UserPlus, Activity } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import {
  SA_STATS,
  SA_CENTERS,
  SA_SUBSCRIPTIONS,
  MONTHLY_REVENUE_SA,
  STUDENT_GROWTH_SA,
  BRANCH_GROWTH_SA,
} from '@/lib/super-admin-data';
import { formatCurrency } from '@/lib/utils';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Period = 'week' | 'month' | 'quarter' | 'year';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'quarter', label: 'This Quarter' },
  { key: 'year', label: 'This Year' },
];

const SUBSCRIPTION_REVENUE_ESTIMATE: Record<string, number> = {
  Starter: 49 * 12,
  Basic: 99 * 24,
  Pro: 249 * 31,
  Enterprise: 599 * 11,
  Custom: 1200 * 3,
};

const CENTER_ATTENDANCE: Record<string, number> = {
  c1: 94,
  c2: 91,
  c3: 87,
  c4: 96,
  c5: 89,
  c6: 85,
  c7: 72,
  c8: 88,
};

const CENTER_REVENUE_ESTIMATE: Record<string, number> = {
  c1: 71880,
  c2: 38688,
  c3: 28512,
  c4: 71880,
  c5: 46512,
  c6: 28512,
  c7: 46512,
  c8: 28512,
};

const SUBSCRIPTION_COLORS: Record<string, string> = {
  Starter: '#94a3b8',
  Basic: '#6366f1',
  Pro: '#8b5cf6',
  Enterprise: '#f59e0b',
  Custom: '#10b981',
};

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('month');

  const sortedCenters = [...SA_CENTERS].sort((a, b) => b.studentCount - a.studentCount);

  const subscriptionRevenueTotal = Object.values(SUBSCRIPTION_REVENUE_ESTIMATE).reduce(
    (s, v) => s + v,
    0
  );

  const subscriptionBadgeVariant = (tier: string) => {
    if (tier === 'enterprise') return 'warning';
    if (tier === 'pro') return 'purple';
    return 'info';
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Platform-wide insights and performance metrics"
        actions={
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        }
      />

      {/* Period selector */}
      <div className="flex items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`h-9 px-4 rounded-xl text-sm font-medium transition-colors ${
              period === p.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(SA_STATS.monthlyRevenue)}
          change={4.3}
          changeLabel="vs last period"
          icon={<DollarSign className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label="Total Students"
          value={SA_STATS.totalStudents}
          change={3.8}
          changeLabel="vs last period"
          icon={<Users className="h-5 w-5 text-violet-600" />}
          iconBg="bg-violet-50"
        />
        <StatCard
          label="New Registrations"
          value={SA_STATS.newRegistrations}
          change={12.5}
          changeLabel="vs last period"
          icon={<UserPlus className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Avg Attendance"
          value="87.6%"
          change={1.2}
          changeLabel="vs last period"
          icon={<Activity className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
      </div>

      {/* Charts 2x2 grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Student Growth */}
        <Card title="Student Growth">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={STUDENT_GROWTH_SA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                formatter={(v: number) => [v.toLocaleString(), 'Students']}
              />
              <Line
                type="monotone"
                dataKey="students"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue Overview */}
        <Card title="Revenue Overview">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MONTHLY_REVENUE_SA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                formatter={(v: number) => [formatCurrency(v), 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Branch Growth */}
        <Card title="Branch Growth">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={BRANCH_GROWTH_SA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                formatter={(v: number) => [v, 'Branches']}
              />
              <Bar dataKey="branches" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Centers */}
        <Card title="Top Centers by Students" noPadding>
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-6 py-3">Center</th>
                  <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wide px-6 py-3">Students</th>
                  <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wide px-3 py-3">Branches</th>
                  <th className="text-center text-xs font-medium text-slate-400 uppercase tracking-wide px-3 py-3">Plan</th>
                  <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wide px-6 py-3">Est. Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sortedCenters.map((center, i) => (
                  <tr key={center.id} className={`hover:bg-slate-50/60 transition-colors ${i !== sortedCenters.length - 1 ? 'border-b border-slate-50' : ''}`}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{center.name}</p>
                          <p className="text-xs text-slate-400">{center.city}, {center.country}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                      {center.studentCount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-slate-600">
                      {center.branchCount}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge
                        label={center.subscription.charAt(0).toUpperCase() + center.subscription.slice(1)}
                        variant={subscriptionBadgeVariant(center.subscription)}
                      />
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-slate-700">
                      {formatCurrency(CENTER_REVENUE_ESTIMATE[center.id] ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Subscription Revenue Breakdown */}
        <Card title="Subscription Revenue Breakdown">
          <div className="space-y-4">
            {SA_SUBSCRIPTIONS.map((plan) => {
              const revenue = SUBSCRIPTION_REVENUE_ESTIMATE[plan.name] ?? 0;
              const pct = subscriptionRevenueTotal > 0 ? (revenue / subscriptionRevenueTotal) * 100 : 0;
              return (
                <div key={plan.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: plan.color }} />
                      <span className="text-sm font-medium text-slate-700">{plan.name}</span>
                      <span className="text-xs text-slate-400">{plan.activeCount} centers</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(revenue)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: plan.color }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 text-right">{pct.toFixed(1)}% of total</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Attendance Rate by Center */}
        <Card title="Attendance Rate by Center">
          <div className="space-y-4">
            {SA_CENTERS.map((center) => {
              const rate = CENTER_ATTENDANCE[center.id] ?? 80;
              const color =
                rate >= 90 ? '#10b981' :
                rate >= 80 ? '#6366f1' :
                '#f59e0b';
              return (
                <div key={center.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{center.name}</p>
                      <p className="text-xs text-slate-400">{center.city}</p>
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{ color }}
                    >
                      {rate}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${rate}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
