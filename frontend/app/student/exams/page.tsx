'use client';

import { useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Timer,
  BookOpen,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { useAuthStore } from '@/lib/store/auth-store';
import { useStudentsQuery } from '@/lib/queries/students';
import { useExamsQuery, useExamResultsQuery } from '@/lib/queries/exams';
import type { Exam } from '@/lib/api/exams';
import { formatLocalizedDate } from '@/i18n/date-locale';
import { isLocale, DEFAULT_LOCALE, type Locale } from '@/i18n/locales';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Real group ids are UUIDs — hash into a stable color, same small helper as
// app/teacher/exams/page.tsx (kept as its own local copy rather than
// shared, same "duplicated per-portal, self-contained" precedent used for
// day-label maps elsewhere in this codebase).
const GROUP_COLOR_PALETTE = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ec4899'];

function groupColor(groupId: string): string {
  let hash = 0;
  for (let i = 0; i < groupId.length; i++) hash = (hash + groupId.charCodeAt(i)) % GROUP_COLOR_PALETTE.length;
  return GROUP_COLOR_PALETTE[hash];
}

function formatDate(dateStr: string, locale: Locale) {
  return formatLocalizedDate(new Date(dateStr + 'T00:00:00'), locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// t is StudentExams's useTranslations return value.
function daysUntil(dateStr: string, t: ReturnType<typeof useTranslations<'StudentExams'>>) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return t('todayRelative');
  if (diff === 1) return t('tomorrowRelative');
  return t('inDaysRelative', { count: diff });
}

function scoreBarColor(pct: number) {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-amber-400';
  return 'bg-red-500';
}

// ─── Upcoming Exam Card ────────────────────────────────────────────────────────

function UpcomingExamCard({ exam }: { exam: Exam }) {
  const t = useTranslations('StudentExams');
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const color = groupColor(exam.group);

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-slate-900 text-sm leading-tight flex-1">{exam.title}</h4>
        <span
          className="text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {exam.group_name}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          {formatDate(exam.date, locale)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          {exam.start_time.slice(0, 5)}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          {exam.room || '—'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Timer className="h-3.5 w-3.5 text-slate-400" />
        <span>{t('durationMinutes', { count: exam.duration_minutes })}</span>
        <span className="text-slate-300 mx-1">·</span>
        <span>{t('questionsCount', { count: exam.question_count })}</span>
        <span className="text-slate-300 mx-1">·</span>
        <span>{t('maxPtsLabel', { points: exam.max_score })}</span>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-1">
          {daysUntil(exam.date, t)}
        </span>
      </div>
    </div>
  );
}

// ─── Completed Exam Card ───────────────────────────────────────────────────────

function CompletedExamCard({ exam, score }: { exam: Exam; score: number | null }) {
  const t = useTranslations('StudentExams');
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const color = groupColor(exam.group);
  const pct = score != null && exam.max_score > 0 ? (score / exam.max_score) * 100 : 0;
  const barColor = scoreBarColor(pct);

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-slate-900 text-sm leading-tight flex-1">{exam.title}</h4>
        <span
          className="text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {exam.group_name}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Calendar className="h-3.5 w-3.5 text-slate-400" />
        {formatDate(exam.date, locale)}
      </div>

      {score != null ? (
        <>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold text-slate-900">{score}</span>
            <span className="text-sm text-slate-400 mb-1">/ {exam.max_score}</span>
            <span className="ml-auto text-xs text-slate-400 mb-1">{Math.round(pct)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
          </div>
        </>
      ) : (
        <p className="text-xs text-slate-400 italic">{t('resultsNotYetEntered')}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentExamsPage() {
  const t = useTranslations('StudentExams');

  const organizationId = useAuthStore((s) => s.user?.organizationId) ?? '';
  const authUserId = useAuthStore((s) => s.user?.id);
  const { data: students = [] } = useStudentsQuery({ organizationId });
  const myProfile = students.find((s) => s.user === authUserId);

  const { data: exams = [] } = useExamsQuery({ organizationId });
  const { data: myResults = [] } = useExamResultsQuery({ organizationId, studentProfile: myProfile?.id });
  const scoreByExam = useMemo(() => new Map(myResults.map((r) => [r.exam, r.score])), [myResults]);

  const upcomingExams = exams.filter((e) => e.status === 'scheduled');
  const completedExams = exams.filter((e) => e.status === 'completed');

  const completedWithScores = completedExams.filter((e) => scoreByExam.get(e.id) != null);
  const avgCompletedScore =
    completedWithScores.length > 0
      ? Math.round(
          completedWithScores.reduce((sum, e) => {
            const score = scoreByExam.get(e.id) ?? 0;
            return sum + (score / e.max_score) * 100;
          }, 0) / completedWithScores.length
        )
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader title={t('pageTitle')} subtitle={t('pageSubtitle')} />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={t('statUpcomingExams')}
          value={upcomingExams.length}
          icon={<Calendar className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label={t('statCompletedExams')}
          value={completedExams.length}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label={t('statAverageScore')}
          value={avgCompletedScore > 0 ? `${avgCompletedScore}%` : '—'}
          icon={<BarChart3 className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
      </div>

      {/* Upcoming Exams */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
          {t('upcomingExamsSection')}
          <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {upcomingExams.length}
          </span>
        </h2>

        {upcomingExams.length === 0 ? (
          <Card>
            <div className="text-center py-10 text-slate-400 text-sm">{t('noUpcomingExamsScheduled')}</div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcomingExams.map((exam) => (
              <UpcomingExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        )}
      </section>

      {/* Completed Exams */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          {t('completedExamsSection')}
          <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {completedExams.length}
          </span>
        </h2>

        {completedExams.length === 0 ? (
          <Card>
            <div className="text-center py-10 text-slate-400 text-sm flex flex-col items-center gap-2">
              <BookOpen className="h-8 w-8 opacity-30" />
              {t('noCompletedExamsYet')}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {completedExams.map((exam) => (
              <CompletedExamCard key={exam.id} exam={exam} score={scoreByExam.get(exam.id) ?? null} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
