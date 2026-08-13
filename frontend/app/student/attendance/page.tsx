'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { STUDENT_ATTENDANCE, WEEKLY_ATTENDANCE_TREND, STUDENT_STATS } from '@/lib/student-data';
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

  const counts = {
    present: STUDENT_ATTENDANCE.filter((r) => r.status === 'present').length,
    absent: STUDENT_ATTENDANCE.filter((r) => r.status === 'absent').length,
    late: STUDENT_ATTENDANCE.filter((r) => r.status === 'late').length,
    excused: STUDENT_ATTENDANCE.filter((r) => r.status === 'excused').length,
  };

  const sorted = [...STUDENT_ATTENDANCE].sort((a, b) => b.date.localeCompare(a.date));

  const BREAKDOWN_ROWS = [
    { key: 'present', label: t('statusPresent'), value: counts.present, color: 'bg-emerald-400' },
    { key: 'absent', label: t('statusAbsent'), value: counts.absent, color: 'bg-red-400' },
    { key: 'late', label: t('statusLate'), value: counts.late, color: 'bg-amber-400' },
    { key: 'excused', label: t('statusExcused'), value: counts.excused, color: 'bg-blue-400' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('pageTitle')} subtitle={t('pageSubtitle')} />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('statAttendanceRate')}
          value={`${STUDENT_STATS.attendanceRate}%`}
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
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={WEEKLY_ATTENDANCE_TREND} margin={{ top: 4, right: 0, bottom: 0, left: -20 }} barSize={28}>
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
          </Card>
        </div>

        {/* Legend / breakdown */}
        <Card title={t('breakdownTitle')} subtitle={t('allTimeRecordSubtitle')}>
          <div className="space-y-4">
            {BREAKDOWN_ROWS.map((row) => {
              const total = STUDENT_ATTENDANCE.length;
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
                    <td className="py-3.5 px-3 text-sm text-slate-600">{rec.groupName}</td>
                    <td className="py-3.5 px-3">
                      <Badge label={config.label} variant={config.variant} dot />
                    </td>
                    <td className="py-3.5 px-3 text-xs text-slate-400">{'note' in rec ? rec.note ?? '—' : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
