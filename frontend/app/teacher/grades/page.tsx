'use client';

import { useState, useMemo } from 'react';
import { Download, TrendingUp, TrendingDown, Minus, GraduationCap, Trophy, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { SearchInput, Select } from '@/components/ui/input';
import { DataTable, Column } from '@/components/ui/data-table';
import { TEACHER_GRADES, TEACHER_GROUPS } from '@/lib/teacher-data';

// ─── Types ────────────────────────────────────────────────────────────────────

type GradeRow = (typeof TEACHER_GRADES)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLetterVariant(letter: string): 'success' | 'info' | 'warning' | 'danger' {
  if (letter.startsWith('A')) return 'success';
  if (letter.startsWith('B')) return 'info';
  if (letter.startsWith('C')) return 'warning';
  return 'danger';
}

function getLetterBase(letter: string): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (letter.startsWith('A')) return 'A';
  if (letter.startsWith('B')) return 'B';
  if (letter.startsWith('C')) return 'C';
  if (letter.startsWith('D')) return 'D';
  return 'F';
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function GradesPage() {
  const t = useTranslations('TeacherGrades');
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  const DIST_CONFIG: { key: 'A' | 'B' | 'C' | 'D' | 'F'; label: string; color: string; bg: string }[] = [
    { key: 'A', label: t('distLabelA'), color: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700' },
    { key: 'B', label: t('distLabelB'), color: 'bg-indigo-500', bg: 'bg-indigo-50 text-indigo-700' },
    { key: 'C', label: t('distLabelC'), color: 'bg-amber-500', bg: 'bg-amber-50 text-amber-700' },
    { key: 'D', label: t('distLabelD'), color: 'bg-orange-500', bg: 'bg-orange-50 text-orange-700' },
    { key: 'F', label: t('distLabelF'), color: 'bg-red-500', bg: 'bg-red-50 text-red-700' },
  ];

  // Filter grades
  const filtered = useMemo(() => {
    return TEACHER_GRADES.filter((g) => {
      const matchSearch =
        !search ||
        g.studentName.toLowerCase().includes(search.toLowerCase()) ||
        g.groupName.toLowerCase().includes(search.toLowerCase());
      const matchGroup = !groupFilter || g.groupId === groupFilter;
      return matchSearch && matchGroup;
    });
  }, [search, groupFilter]);

  // Stats computed from ALL grades (not filtered)
  const classAvg = Math.round(
    TEACHER_GRADES.reduce((s, g) => s + g.finalGrade, 0) / TEACHER_GRADES.length
  );
  const topScore = Math.max(...TEACHER_GRADES.map((g) => g.finalGrade));
  const belowSixty = TEACHER_GRADES.filter((g) => g.finalGrade < 60).length;

  // Grade distribution
  const distCount = useMemo<Record<'A' | 'B' | 'C' | 'D' | 'F', number>>(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const g of TEACHER_GRADES) {
      counts[getLetterBase(g.letterGrade)]++;
    }
    return counts;
  }, []);
  const maxDistCount = Math.max(...Object.values(distCount), 1);

  // Group select options
  const groupOptions = TEACHER_GROUPS.map((g) => ({ value: g.id, label: g.name }));

  // Table columns
  const columns: Column<GradeRow>[] = [
    {
      key: 'studentName',
      label: t('colStudent'),
      render: (_v, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.studentName} size="sm" />
          <span className="font-medium text-slate-900">{row.studentName}</span>
        </div>
      ),
    },
    {
      key: 'groupName',
      label: t('colGroup'),
      render: (_v, row) => (
        <Badge label={row.groupName} variant="secondary" />
      ),
    },
    {
      key: 'assignmentScore',
      label: t('colAssignment'),
      render: (_v, row) => <span>{row.assignmentScore}</span>,
    },
    {
      key: 'examScore',
      label: t('colExam'),
      render: (_v, row) => <span>{row.examScore}</span>,
    },
    {
      key: 'participation',
      label: t('colParticipation'),
      render: (_v, row) => <span>{row.participation}</span>,
    },
    {
      key: 'finalGrade',
      label: t('colFinalGrade'),
      render: (_v, row) => (
        <span className="font-bold text-slate-900">{row.finalGrade}</span>
      ),
    },
    {
      key: 'letterGrade',
      label: t('colLetterGrade'),
      render: (_v, row) => (
        <Badge label={row.letterGrade} variant={getLetterVariant(row.letterGrade)} />
      ),
    },
    {
      key: 'trend',
      label: t('colTrend'),
      render: (_v, row) => {
        if (row.trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-500" />;
        if (row.trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
        return <Minus className="h-4 w-4 text-slate-400" />;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
        actions={
          <>
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
            />
            <Select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              options={groupOptions}
              placeholder={t('allGroupsPlaceholder')}
              className="w-40"
            />
            <Button variant="outline" size="md">
              <Download className="h-4 w-4" />
              {t('exportButton')}
            </Button>
          </>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={t('statClassAverage')}
          value={`${classAvg}%`}
          icon={<GraduationCap className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label={t('statTopScore')}
          value={`${topScore}%`}
          icon={<Trophy className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
        <StatCard
          label={t('statStudentsBelow60')}
          value={belowSixty}
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-50"
        />
      </div>

      {/* Grade Table */}
      <Card title={t('gradeOverviewTitle')} subtitle={t('studentsCountSubtitle', { count: filtered.length })}>
        <DataTable<GradeRow>
          columns={columns}
          data={filtered}
          keyField="id"
          emptyMessage={t('noGradesFound')}
        />
      </Card>

      {/* Grade Distribution */}
      <Card title={t('gradeDistributionTitle')} subtitle={t('allStudentsAllGroupsSubtitle')}>
        <div className="space-y-4">
          {DIST_CONFIG.map(({ key, label, color, bg }) => {
            const count = distCount[key];
            const pct = Math.round((count / TEACHER_GRADES.length) * 100);
            const barWidth = Math.round((count / maxDistCount) * 100);
            return (
              <div key={key} className="flex items-center gap-4">
                <span className={`inline-flex items-center justify-center rounded-lg px-2.5 py-0.5 text-xs font-semibold w-32 flex-shrink-0 ${bg}`}>
                  {label}
                </span>
                <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-700 w-8 text-right">{count}</span>
                <span className="text-xs text-slate-400 w-10 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
