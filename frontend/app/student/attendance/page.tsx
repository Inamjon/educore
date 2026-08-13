'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CheckCircle2, XCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store/auth-store';
import { useStudentsQuery } from '@/lib/queries/students';
import { useAttendanceQuery } from '@/lib/queries/attendance';
import type { AttendanceRecord } from '@/lib/api/attendance';
import { ApiError } from '@/lib/api/client';
import { formatLocalizedDate } from '@/i18n/date-locale';
import { isLocale, DEFAULT_LOCALE, type Locale } from '@/i18n/locales';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string, locale: Locale) {
  return formatLocalizedDate(new Date(dateStr + 'T00:00:00'), locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Monday of the ISO week containing `dateStr`, as an ISO date string — used
 * to bucket records into weeks for the trend chart, same "derive don't
 * store" approach as the Admin/Teacher attendance pages' rate calcs. */
function weekStartOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const mondayOffset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - mondayOffset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentAttendancePage() {
  const t = useTranslations('StudentAttendance');
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  // Local status → label/variant map, deliberately not the shared
  // <StatusBadge> — that component is used across every portal and isn't
  // locale-aware, so this page maps its own small set of statuses instead
  // of translating a component other (untranslated) portals also render.
  const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'info' }> = {
    present: { label: t('statusPresent'), variant: 'success' },
    absent: { label: t('statusAbsent'), variant: 'danger' },
    late: { label: t('statusLate'), variant: 'warning' },
    excused: { label: t('statusExcused'), variant: 'info' },
  };

  const organizationId = useAuthStore((s) => s.user?.organizationId) ?? '';
  const authUserId = useAuthStore((s) => s.user?.id);
  const { data: students = [] } = useStudentsQuery({ organizationId });
  const myProfile = students.find((s) => s.user === authUserId);

  const {
    data: records,
    isLoading,
    isError,
    error,
  } = useAttendanceQuery({ organizationId, studentProfile: myProfile?.id });

  const list: AttendanceRecord[] = records ?? [];
  const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));

  const counts = {
    present: list.filter((r) => r.status === 'present').length,
    absent: list.filter((r) => r.status === 'absent').length,
    late: list.filter((r) => r.status === 'late').length,
    excused: list.filter((r) => r.status === 'excused').length,
  };

  const total = list.length;
  const attendanceRate = total > 0 ? Math.round((counts.present / total) * 100) : 0;

  const BREAKDOWN_ROWS = [
    { key: 'present', label: t('statusPresent'), value: counts.present, color: 'bg-emerald-400' },
    { key: 'absent', label: t('statusAbsent'), value: counts.absent, color: 'bg-red-400' },
    { key: 'late', label: t('statusLate'), value: counts.late, color: 'bg-amber-400' },
    { key: 'excused', label: t('statusExcused'), value: counts.excused, color: 'bg-blue-400' },
  ];

  // Weekly attendance-rate trend — last 6 ISO weeks (Monday-start) that have
  // at least one record, oldest first, same shape as the mock data this
  // replaces ({ name: 'Wk N', rate }).
  const weeklyTrend = useMemo(() => {
    const byWeek = new Map<string, { present: number; total: number }>();
    for (const r of list) {
      const key = weekStartOf(r.date);
      const bucket = byWeek.get(key) ?? { present: 0, total: 0 };
      bucket.total += 1;
      if (r.status === 'present') bucket.present += 1;
      byWeek.set(key, bucket);
    }
    const weeks = [...byWeek.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-6);
    return weeks.map(([, bucket], i) => ({
      name: t('weekLabel', { number: i + 1 }),
      rate: Math.round((bucket.present / bucket.total) * 100),
    }));
  }, [list, t]);

  return (
    <div className="space-y-6">
      <PageHeader title={t('pageTitle')} subtitle={t('pageSubtitle')} />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('statAttendanceRate')}
          value={`${attendanceRate}%`}
          icon={<CheckCircle2 className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label={t('statPresent')}
          value={counts.present}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label={t('statAbsent')}
          value={counts.absent}
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-50"
        />
        <StatCard
          label={t('statLateExcused')}
          value={counts.late + counts.excused}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend chart */}
        <div className="lg:col-span-2">
          <Card title={t('weeklyRateTitle')} subtitle={t('last6WeeksSubtitle')}>
            {weeklyTrend.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">{t('noAttendanceRecordsYet')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weeklyTrend} margin={{ top: 4, right: 0, bottom: 0, left: -20 }} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: '12px' }}
                    formatter={(value: unknown) => [`${value}%`, t('tooltipAttendanceLabel')]}
                  />
                  <Bar dataKey="rate" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Legend / breakdown */}
        <Card title={t('breakdownTitle')} subtitle={t('allTimeRecordSubtitle')}>
          <div className="space-y-4">
            {BREAKDOWN_ROWS.map((row) => {
              const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
              return (
                <div key={row.key}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
                      {row.label}
                    </span>
                    <span className="font-semibold text-slate-800">{row.value}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* History Table */}
      <Card title={t('historyTitle')} subtitle={t('recordedSessions', { count: sorted.length })}>
        {isError ? (
          <div className="flex items-center gap-2 py-8 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error instanceof ApiError ? error.message : t('loadErrorFallback')}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('loadingAttendance')}
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t('noAttendanceRecordsYet')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">{t('colDate')}</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">{t('colCourse')}</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">{t('colStatus')}</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">{t('colNote')}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((rec) => {
                  const config = STATUS_CONFIG[rec.status] ?? { label: rec.status, variant: 'info' as const };
                  return (
                    <tr key={rec.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-3 text-sm text-slate-700">{formatDate(rec.date, locale)}</td>
                      <td className="py-3.5 px-3 text-sm text-slate-600">{rec.group_name}</td>
                      <td className="py-3.5 px-3">
                        <Badge label={config.label} variant={config.variant} dot />
                      </td>
                      <td className="py-3.5 px-3 text-xs text-slate-400">{rec.notes ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
