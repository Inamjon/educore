'use client';

import {
  Calendar,
  Clock,
  MapPin,
  Timer,
  BookOpen,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { STUDENT_EXAMS } from '@/lib/student-data';

// ─── Types ────────────────────────────────────────────────────────────────────

type Exam = (typeof STUDENT_EXAMS)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysUntil(dateStr: string) {
  const now = new Date('2026-07-04');
  const target = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `In ${diff} days`;
}

function scoreBarColor(pct: number) {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-amber-400';
  return 'bg-red-500';
}

// ─── Upcoming Exam Card ────────────────────────────────────────────────────────

function UpcomingExamCard({ exam }: { exam: Exam & { status: 'upcoming' } }) {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3"
      style={{ borderLeft: `4px solid ${exam.courseColor}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-slate-900 text-sm leading-tight flex-1">{exam.title}</h4>
        <span
          className="text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: `${exam.courseColor}18`, color: exam.courseColor }}
        >
          {exam.groupName}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          {formatDate(exam.date)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          {exam.startTime}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          {exam.room}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Timer className="h-3.5 w-3.5 text-slate-400" />
        <span>{exam.duration} min</span>
        <span className="text-slate-300 mx-1">·</span>
        <span>{exam.questions} questions</span>
        <span className="text-slate-300 mx-1">·</span>
        <span>Max {exam.maxScore} pts</span>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-1">
          {daysUntil(exam.date)}
        </span>
      </div>
    </div>
  );
}

// ─── Completed Exam Card ───────────────────────────────────────────────────────

function CompletedExamCard({ exam }: { exam: Exam & { status: 'completed'; score: number } }) {
  const pct = exam.maxScore > 0 ? (exam.score / exam.maxScore) * 100 : 0;
  const barColor = scoreBarColor(pct);

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3"
      style={{ borderLeft: `4px solid ${exam.courseColor}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-slate-900 text-sm leading-tight flex-1">{exam.title}</h4>
        <span
          className="text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: `${exam.courseColor}18`, color: exam.courseColor }}
        >
          {exam.groupName}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Calendar className="h-3.5 w-3.5 text-slate-400" />
        {formatDate(exam.date)}
      </div>

      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold text-slate-900">{exam.score}</span>
        <span className="text-sm text-slate-400 mb-1">/ {exam.maxScore}</span>
        <span className="ml-auto text-xs text-slate-400 mb-1">{Math.round(pct)}%</span>
      </div>

      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentExamsPage() {
  const upcomingExams = STUDENT_EXAMS.filter((e) => e.status === 'upcoming') as Array<
    Exam & { status: 'upcoming' }
  >;
  const completedExams = STUDENT_EXAMS.filter((e) => e.status === 'completed') as Array<
    Exam & { status: 'completed'; score: number }
  >;

  const avgCompletedScore =
    completedExams.length > 0
      ? Math.round(
          completedExams.reduce((sum, e) => sum + (e.score / e.maxScore) * 100, 0) / completedExams.length
        )
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Exams" subtitle="Your upcoming and completed exams" />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Upcoming Exams"
          value={upcomingExams.length}
          icon={<Calendar className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label="Completed Exams"
          value={completedExams.length}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Average Score"
          value={avgCompletedScore > 0 ? `${avgCompletedScore}%` : '—'}
          icon={<BarChart3 className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
      </div>

      {/* Upcoming Exams */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
          Upcoming Exams
          <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {upcomingExams.length}
          </span>
        </h2>

        {upcomingExams.length === 0 ? (
          <Card>
            <div className="text-center py-10 text-slate-400 text-sm">No upcoming exams scheduled.</div>
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
          Completed Exams
          <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {completedExams.length}
          </span>
        </h2>

        {completedExams.length === 0 ? (
          <Card>
            <div className="text-center py-10 text-slate-400 text-sm flex flex-col items-center gap-2">
              <BookOpen className="h-8 w-8 opacity-30" />
              No completed exams yet.
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {completedExams.map((exam) => (
              <CompletedExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
