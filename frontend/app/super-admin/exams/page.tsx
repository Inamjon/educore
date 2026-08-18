'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { AlertCircle, Award, BarChart3, CalendarCheck, CalendarClock, Loader2, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchInput, Select } from '@/components/ui/input';
import { DataTable, Column } from '@/components/ui/data-table';
import { useOrganizationsQuery } from '@/lib/queries/organizations';
import { useExamResultsQuery, useExamsQuery } from '@/lib/queries/exams';
import type { Exam, ExamStatus } from '@/lib/api/exams';
import { ApiError } from '@/lib/api/client';
import { formatLocalizedDate } from '@/i18n/date-locale';
import { isLocale, DEFAULT_LOCALE, type Locale } from '@/i18n/locales';

function formatDate(dateStr: string, locale: Locale) {
  return formatLocalizedDate(new Date(dateStr + 'T00:00:00'), locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Read-only, platform-wide — same convention as the Super-Admin Teachers/
// Students pages: a super_admin oversees every center's exams, but
// scheduling/grading stays each center's own operational responsibility
// (Admin/Teacher portals already have full CRUD for this). No create/edit/
// delete here, and the results view below has no score-entry inputs.
function ExamResultsView({ exam, organizations, onClose }: { exam: Exam; organizations: { id: string; name: string }[]; onClose: () => void }) {
  const t = useTranslations('SuperAdminExams');
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const { data: results = [], isLoading } = useExamResultsQuery({ exam: exam.id });
  const centerName = organizations.find((o) => o.id === exam.organization)?.name ?? '—';

  const graded = results.filter((r) => r.score != null);
  const avg = graded.length > 0 ? Math.round(graded.reduce((sum, r) => sum + (r.score as number), 0) / graded.length) : null;

  return (
    <Card className="mt-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{exam.title}</h3>
            <StatusBadge status={exam.status} />
          </div>
          <p className="text-xs text-slate-400 mt-1">{centerName} · {exam.group_name}</p>
        </div>
        <div className="flex items-center gap-3">
          {avg != null && (
            <div className="text-right">
              <p className="text-xs text-slate-400">{t('averageLabel')}</p>
              <p className="text-lg font-bold text-indigo-600">{avg}<span className="text-sm font-normal text-slate-400">/{exam.max_score}</span></p>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('loadingResults')}
        </div>
      ) : results.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">{t('noResultsYet')}</p>
      ) : (
        <div className="divide-y divide-slate-50">
          {results.map((r) => (
            <div key={r.id} className="flex items-center gap-3 py-3">
              <Avatar name={r.student_name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{r.student_name}</p>
                <p className="text-xs text-slate-400">{r.graded_at ? formatDate(r.graded_at.slice(0, 10), locale) : '—'}</p>
              </div>
              {r.score != null ? (
                <span className="text-sm font-semibold text-emerald-700">{r.score}/{exam.max_score}</span>
              ) : (
                <span className="text-xs text-slate-400">{t('awaitingGrading')}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function SuperAdminExamsPage() {
  const t = useTranslations('SuperAdminExams');
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  const STATUS_OPTIONS = [
    { value: '', label: t('statusAll') },
    { value: 'scheduled', label: t('statusScheduled') },
    { value: 'completed', label: t('statusCompleted') },
    { value: 'cancelled', label: t('statusCancelled') },
  ];

  const [search, setSearch] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [status, setStatus] = useState<ExamStatus | ''>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: centers } = useOrganizationsQuery();
  const {
    data: exams,
    isLoading,
    isError,
    error,
  } = useExamsQuery({
    organizationId: organizationId || undefined,
    status: status || undefined,
  });
  // Platform-wide, unfiltered by center/status — feeds the Average Score
  // stat card independent of whatever filter is active, same pattern as
  // the Admin Exams page's own allResults query.
  const { data: allResults } = useExamResultsQuery({});

  const centerOptions = [{ value: '', label: t('allCentersPlaceholder') }, ...(centers ?? []).map((c) => ({ value: c.id, label: c.name }))];
  const organizations = centers ?? [];

  const list = exams ?? [];
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter((e) => !q || e.title.toLowerCase().includes(q) || e.group_name.toLowerCase().includes(q));
  }, [list, search]);
  const selectedExam = list.find((e) => e.id === selectedId) ?? null;

  const avgScoreByExam = useMemo(() => {
    const map = new Map<string, number>();
    const byExam = new Map<string, number[]>();
    (allResults ?? []).forEach((r) => {
      if (r.score == null) return;
      const scores = byExam.get(r.exam) ?? [];
      scores.push(r.score);
      byExam.set(r.exam, scores);
    });
    byExam.forEach((scores, examId) => map.set(examId, Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)));
    return map;
  }, [allResults]);

  const upcomingCount = list.filter((e) => e.status === 'scheduled').length;
  const completedExams = list.filter((e) => e.status === 'completed');
  const avgScoreAcrossCompleted = (() => {
    const percentages = completedExams
      .filter((e) => avgScoreByExam.has(e.id) && e.max_score > 0)
      .map((e) => ((avgScoreByExam.get(e.id) as number) / e.max_score) * 100);
    if (percentages.length === 0) return null;
    return Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
  })();

  const columns: Column<Exam>[] = [
    {
      key: 'title',
      label: t('columnExam'),
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-900">{row.title}</p>
          <p className="text-xs text-slate-400">{row.group_name}</p>
        </div>
      ),
    },
    {
      key: 'organization',
      label: t('columnCenter'),
      render: (_, row) => <span className="text-sm text-slate-700 whitespace-nowrap">{organizations.find((o) => o.id === row.organization)?.name ?? '—'}</span>,
    },
    {
      key: 'date',
      label: t('columnDateTime'),
      render: (_, row) => (
        <div>
          <p className="text-sm text-slate-700">{formatDate(row.date, locale)}</p>
          <p className="text-xs text-slate-400">{row.start_time.slice(0, 5)}</p>
        </div>
      ),
    },
    { key: 'status', label: t('columnStatus'), render: (val) => <StatusBadge status={String(val)} /> },
    {
      key: 'score',
      label: t('columnScore'),
      render: (_, row) =>
        avgScoreByExam.has(row.id) ? (
          <span className="text-sm font-semibold text-slate-700">{avgScoreByExam.get(row.id)}/{row.max_score}</span>
        ) : (
          <span className="text-xs text-slate-400">{t('noResultsYet')}</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('pageTitle')} subtitle={t('pageSubtitle')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('statTotalExams')} value={list.length} icon={<Award className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label={t('statUpcomingExams')} value={upcomingCount} icon={<CalendarClock className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard label={t('statCompletedExams')} value={completedExams.length} icon={<CalendarCheck className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label={t('statAverageScore')} value={avgScoreAcrossCompleted != null ? `${avgScoreAcrossCompleted}%` : '—'} icon={<BarChart3 className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
      </div>

      <Card
        noPadding
        title={t('allExamsTitle')}
        subtitle={t('examsOfCount', { filtered: filtered.length, total: list.length })}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('searchPlaceholder')} className="w-52" />
            <Select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} options={centerOptions} />
            <Select value={status} onChange={(e) => setStatus(e.target.value as ExamStatus | '')} options={STATUS_OPTIONS} />
            {(search || organizationId || status) && (
              <button
                onClick={() => {
                  setSearch('');
                  setOrganizationId('');
                  setStatus('');
                }}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> {t('clearButton')}
              </button>
            )}
          </div>
        }
      >
        {isError ? (
          <div className="flex items-center gap-2 px-6 py-8 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error instanceof ApiError ? error.message : t('loadErrorFallback')}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('loadingExams')}
          </div>
        ) : (
          <DataTable<Exam> columns={columns} data={filtered} keyField="id" onRowClick={(row) => setSelectedId(row.id)} emptyMessage={t('noExamsFound')} />
        )}
      </Card>

      {selectedExam && (
        <ExamResultsView key={selectedExam.id} exam={selectedExam} organizations={organizations} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
