'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
  Legend,
} from 'recharts';
import {
  Building2,
  GitBranch,
  Users,
  GraduationCap,
  ShieldCheck,
  DollarSign,
  CreditCard,
  UserPlus,
  Link2,
  BarChart2,
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  SA_STATS,
  SA_AUDIT_LOGS,
  MONTHLY_REVENUE_SA,
  STUDENT_GROWTH_SA,
  SUBSCRIPTION_DIST_SA,
  BRANCH_GROWTH_SA,
} from '@/lib/super-admin-data';
import { useSAProfileStore } from '@/lib/store/sa-profile-store';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// t is SuperAdminDashboard's useTranslations return value — see
// app/teacher/notifications/page.tsx's formatTime for the identical pattern.
function formatRelativeTime(isoString: string, t: ReturnType<typeof useTranslations<'SuperAdminDashboard'>>) {
  const now = new Date('2026-07-04T16:47:40Z');
  const then = new Date(isoString);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return t('minutesAgo', { count: diffMin });
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return t('hoursAgo', { count: diffH });
  return t('daysAgo', { count: Math.floor(diffH / 24) });
}

const severityDot: Record<string, string> = {
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
};

const actionBadgeVariant: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'secondary'
> = {
  CENTER_CREATED: 'success',
  LOGIN_FAILED: 'danger',
  SUBSCRIPTION_UPGRADED: 'purple',
  BRANCH_SUSPENDED: 'warning',
  PAYMENT_RECEIVED: 'info',
  ADMIN_ADDED: 'success',
  SETTINGS_UPDATED: 'secondary',
  USER_DELETED: 'danger',
};

// ─── Tooltip style shared ─────────────────────────────────────────────────────

const tooltipStyle = {
  contentStyle: {
    borderRadius: '12px',
    border: 'none',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    fontSize: '12px',
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuperAdminDashboardPage() {
  const t = useTranslations('SuperAdminDashboard');
  const profile = useSAProfileStore((s) => s.profile);
  const recentLogs = SA_AUDIT_LOGS.slice(0, 5);

  const ACTION_LABELS: Record<string, string> = {
    CENTER_CREATED: t('actionCenterCreated'),
    LOGIN_FAILED: t('actionLoginFailed'),
    SUBSCRIPTION_UPGRADED: t('actionSubscriptionUpgraded'),
    BRANCH_SUSPENDED: t('actionBranchSuspended'),
    PAYMENT_RECEIVED: t('actionPaymentReceived'),
    ADMIN_ADDED: t('actionAdminAdded'),
    SETTINGS_UPDATED: t('actionSettingsUpdated'),
    USER_DELETED: t('actionUserDeleted'),
  };

  const QUICK_ACTIONS = [
    {
      label: t('quickActionCreateCenter'),
      href: '/super-admin/centers',
      icon: <Building2 className="h-6 w-6 text-violet-600" />,
      iconBg: 'bg-violet-50',
    },
    {
      label: t('quickActionCreateBranch'),
      href: '/super-admin/branches',
      icon: <GitBranch className="h-6 w-6 text-indigo-600" />,
      iconBg: 'bg-indigo-50',
    },
    {
      label: t('quickActionAddAdministrator'),
      href: '/super-admin/administrators',
      icon: <ShieldCheck className="h-6 w-6 text-amber-600" />,
      iconBg: 'bg-amber-50',
    },
    {
      label: t('quickActionAssignBranch'),
      href: '/super-admin/administrators',
      icon: <Link2 className="h-6 w-6 text-blue-600" />,
      iconBg: 'bg-blue-50',
    },
    {
      label: t('quickActionViewReports'),
      href: '/super-admin/reports',
      icon: <BarChart2 className="h-6 w-6 text-emerald-600" />,
      iconBg: 'bg-emerald-50',
    },
  ];

  const KPI_CARDS = [
    {
      label: t('kpiTotalCenters'),
      value: SA_STATS.totalCenters,
      change: 12.5,
      changeLabel: t('vsLastMonth'),
      icon: <Building2 className="h-5 w-5 text-violet-600" />,
      iconBg: 'bg-violet-50',
    },
    {
      label: t('kpiTotalBranches'),
      value: SA_STATS.totalBranches,
      change: 4.8,
      changeLabel: t('vsLastMonth'),
      icon: <GitBranch className="h-5 w-5 text-indigo-600" />,
      iconBg: 'bg-indigo-50',
    },
    {
      label: t('kpiTotalStudents'),
      value: SA_STATS.totalStudents,
      change: 7.2,
      changeLabel: t('vsLastMonth'),
      icon: <Users className="h-5 w-5 text-blue-600" />,
      iconBg: 'bg-blue-50',
    },
    {
      label: t('kpiTotalTeachers'),
      value: SA_STATS.totalTeachers,
      change: 3.1,
      changeLabel: t('vsLastMonth'),
      icon: <GraduationCap className="h-5 w-5 text-emerald-600" />,
      iconBg: 'bg-emerald-50',
    },
    {
      label: t('kpiActiveAdmins'),
      value: SA_STATS.activeAdmins,
      change: -1.3,
      changeLabel: t('vsLastMonth'),
      icon: <ShieldCheck className="h-5 w-5 text-amber-600" />,
      iconBg: 'bg-amber-50',
    },
    {
      label: t('kpiMonthlyRevenue'),
      value: '$284,600',
      change: 4.1,
      changeLabel: t('vsLastMonth'),
      icon: <DollarSign className="h-5 w-5 text-green-600" />,
      iconBg: 'bg-green-50',
    },
    {
      label: t('kpiActiveSubscriptions'),
      value: SA_STATS.activeSubscriptions,
      change: 2.6,
      changeLabel: t('vsLastMonth'),
      icon: <CreditCard className="h-5 w-5 text-purple-600" />,
      iconBg: 'bg-purple-50',
    },
    {
      label: t('kpiNewRegistrations'),
      value: SA_STATS.newRegistrations,
      change: 18.4,
      changeLabel: t('vsLastMonth'),
      icon: <UserPlus className="h-5 w-5 text-pink-600" />,
      iconBg: 'bg-pink-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-violet-700 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{t('welcomeBack', { name: profile.name })}</h2>
            <p className="text-violet-200 text-sm mt-1">
              {t('welcomeSubtitle')}
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-2">
            <div className="bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              🏢 {t('centersBadge', { count: SA_STATS.totalCenters })}
            </div>
            <div className="bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              💰 {t('revenueBadge')}
            </div>
            <div className="bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              📋 {t('activeSubsBadge', { count: SA_STATS.activeSubscriptions })}
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            change={card.change}
            changeLabel={card.changeLabel}
            icon={card.icon}
            iconBg={card.iconBg}
          />
        ))}
      </div>

      {/* ── Charts Row 1 ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview — col-span-2 */}
        <div className="lg:col-span-2">
          <Card title={t('revenueOverviewTitle')} subtitle={t('revenueOverviewSubtitle')}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart
                data={MONTHLY_REVENUE_SA}
                margin={{ top: 4, right: 0, bottom: 0, left: -10 }}
              >
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  yAxisId="rev"
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="sub"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value, name) =>
                    name === 'revenue'
                      ? [`$${Number(value ?? 0).toLocaleString()}`, t('revenueLegend')]
                      : [String(value ?? ''), t('subscriptionsLegend')]
                  }
                />
                <Area
                  yAxisId="rev"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                  name="revenue"
                />
                <Area
                  yAxisId="sub"
                  type="monotone"
                  dataKey="subscriptions"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fill="url(#subGrad)"
                  name="subscriptions"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 justify-center">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 inline-block" /> {t('revenueLegend')}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500 inline-block" /> {t('subscriptionsLegend')}
              </span>
            </div>
          </Card>
        </div>

        {/* Subscription Distribution */}
        <Card title={t('subscriptionDistributionTitle')} subtitle={t('subscriptionDistributionSubtitle')}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={SUBSCRIPTION_DIST_SA}
                cx="50%"
                cy="46%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {SUBSCRIPTION_DIST_SA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                {...tooltipStyle}
                formatter={(value: unknown) => [t('centersCount', { count: Number(value) }), undefined]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Charts Row 2 ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Growth */}
        <Card title={t('studentGrowthTitle')} subtitle={t('studentGrowthSubtitle')}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={STUDENT_GROWTH_SA}
              margin={{ top: 4, right: 0, bottom: 0, left: -10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value: unknown) => [Number(value).toLocaleString(), t('studentsLegend')]}
              />
              <Line
                type="monotone"
                dataKey="students"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ fill: '#6366f1', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Branch Growth */}
        <Card title={t('branchGrowthTitle')} subtitle={t('branchGrowthSubtitle')}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={BRANCH_GROWTH_SA}
              margin={{ top: 4, right: 0, bottom: 0, left: -20 }}
              barSize={20}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value) => [String(value ?? ''), t('branchesLegend')]}
              />
              <Bar dataKey="branches" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Branches" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent Activity */}
        <Card title={t('recentActivityTitle')} subtitle={t('recentActivitySubtitle')}>
          <div className="space-y-3.5">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5">
                {/* severity dot */}
                <div className="mt-1.5 flex-shrink-0">
                  <span
                    className={`h-2 w-2 rounded-full inline-block ${severityDot[log.severity] ?? 'bg-slate-400'}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      label={ACTION_LABELS[log.action] ?? log.action.replace(/_/g, ' ')}
                      variant={actionBadgeVariant[log.action] ?? 'default'}
                    />
                  </div>
                  <p className="text-xs font-medium text-slate-700 mt-0.5 truncate">
                    {log.entityName}
                  </p>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-xs text-slate-400 truncate">{log.user}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {formatRelativeTime(log.date, t)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <Card title={t('quickActionsTitle')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-slate-100 hover:border-slate-200 hover:shadow-sm"
            >
              <div className={`p-3 rounded-xl ${action.iconBg}`}>{action.icon}</div>
              <span className="text-xs font-medium text-slate-700 text-center leading-tight">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
