'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Input, Select } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat-card';
import {
  TEACHER_EXAMS,
  TEACHER_GROUPS,
  TEACHER_STUDENTS,
} from '@/lib/teacher-data';
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Timer,
  Users,
  ClipboardCheck,
  CheckCircle2,
  BarChart3,
  ChevronLeft,
  XCircle,
  Edit2,
  Trash2,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Exam = (typeof TEACHER_EXAMS)[number];

interface ResultState {
  [studentId: string]: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function scoreBarColor(avg: number, max: number) {
  const pct = max > 0 ? (avg / max) * 100 : 0;
  if (pct > 80) return 'bg-emerald-500';
  if (pct > 60) return 'bg-amber-400';
  return 'bg-red-500';
}

// ─── Group badge colors ────────────────────────────────────────────────────────

const GROUP_COLORS: Record<string, string> = {
  g1: 'bg-indigo-100 text-indigo-700',
  g2: 'bg-violet-100 text-violet-700',
  g3: 'bg-cyan-100 text-cyan-700',
};

// ─── Create Exam Form ──────────────────────────────────────────────────────────

interface CreateFormValues {
  title: string;
  groupId: string;
  date: string;
  startTime: string;
  duration: string;
  room: string;
  maxScore: string;
}

const EMPTY_FORM: CreateFormValues = {
  title: '',
  groupId: '',
  date: '',
  startTime: '',
  duration: '90',
  room: '',
  maxScore: '100',
};

// ─── Results Panel ─────────────────────────────────────────────────────────────

interface ResultsPanelProps {
  exam: Exam;
  onClose: () => void;
}

function ResultsPanel({ exam, onClose }: ResultsPanelProps) {
  const students = TEACHER_STUDENTS.filter((s) => s.groupId === exam.groupId);
  const [results, setResults] = useState<ResultState>(() => {
    const init: ResultState = {};
    students.forEach((s) => {
      init[s.id] = '';
    });
    return init;
  });
  const [saved, setSaved] = useState(false);

  const scores = Object.values(results)
    .map(Number)
    .filter((v) => !isNaN(v) && v > 0);
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  function handleScore(studentId: string, value: string) {
    setResults((prev) => ({ ...prev, [studentId]: value }));
    setSaved(false);
  }

  return (
    <Card className="mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h3 className="font-semibold text-slate-900">{exam.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Enter Results</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {scores.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-400">Current Average</p>
              <p className="text-lg font-bold text-indigo-600">
                {avg}
                <span className="text-sm font-normal text-slate-400">/{exam.maxScore}</span>
              </p>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">
                Student
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">
                Score
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">
                Grade
              </th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-slate-400 text-sm py-12">
                  No students in this group.
                </td>
              </tr>
            )}
            {students.map((student) => {
              const scoreVal = Number(results[student.id]);
              const pct = exam.maxScore > 0 ? (scoreVal / exam.maxScore) * 100 : 0;
              const letterGrade =
                scoreVal === 0
                  ? '—'
                  : pct >= 90
                  ? 'A'
                  : pct >= 80
                  ? 'B'
                  : pct >= 70
                  ? 'C'
                  : pct >= 60
                  ? 'D'
                  : 'F';

              return (
                <tr
                  key={student.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={student.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{student.name}</p>
                        <p className="text-xs text-slate-400">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={exam.maxScore}
                        value={results[student.id] ?? ''}
                        onChange={(e) => handleScore(student.id, e.target.value)}
                        placeholder="—"
                        className="w-20 h-8 rounded-lg border border-slate-200 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-slate-400">/ {exam.maxScore}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-sm font-bold ${
                        scoreVal === 0
                          ? 'text-slate-300'
                          : pct >= 80
                          ? 'text-emerald-600'
                          : pct >= 60
                          ? 'text-amber-600'
                          : 'text-red-500'
                      }`}
                    >
                      {letterGrade}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
        {saved ? (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Results saved successfully
          </span>
        ) : (
          <span className="text-xs text-slate-400">
            {scores.length}/{students.length} students scored
          </span>
        )}
        <Button variant="primary" onClick={() => setSaved(true)}>
          Save Results
        </Button>
      </div>
    </Card>
  );
}

// ─── Upcoming Exam Card ────────────────────────────────────────────────────────

interface UpcomingExamCardProps {
  exam: Exam & { status: 'upcoming' };
}

function UpcomingExamCard({ exam }: UpcomingExamCardProps) {
  const colorClass = GROUP_COLORS[exam.groupId] ?? 'bg-slate-100 text-slate-700';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-indigo-500 p-5 flex flex-col gap-3">
      {/* Title + Group */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-slate-900 text-sm leading-tight flex-1">{exam.title}</h4>
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${colorClass}`}>
          {exam.groupName}
        </span>
      </div>

      {/* Date & Time */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          {formatDate(exam.date)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          {exam.startTime}
        </span>
      </div>

      {/* Room & Duration */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          {exam.room}
        </span>
        <span className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5 text-slate-400" />
          {exam.duration} min
        </span>
      </div>

      {/* Students */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Users className="h-3.5 w-3.5 text-slate-400" />
        <span>{exam.totalStudents} students</span>
        <span className="text-slate-300 mx-1">·</span>
        <span>{exam.questions} questions</span>
        <span className="text-slate-300 mx-1">·</span>
        <span>Max {exam.maxScore} pts</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button variant="outline" size="sm">
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── Completed Exam Card ───────────────────────────────────────────────────────

interface CompletedExamCardProps {
  exam: Exam & { status: 'completed' };
  onEnterResults: (exam: Exam) => void;
  isActive: boolean;
}

function CompletedExamCard({ exam, onEnterResults, isActive }: CompletedExamCardProps) {
  const avgScore = (exam as { avgScore?: number }).avgScore ?? 0;
  const colorClass = GROUP_COLORS[exam.groupId] ?? 'bg-slate-100 text-slate-700';
  const barColor = scoreBarColor(avgScore, exam.maxScore);
  const pct = exam.maxScore > 0 ? (avgScore / exam.maxScore) * 100 : 0;
  const hasResults = avgScore > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3">
      {/* Title + Group */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-slate-900 text-sm leading-tight flex-1">{exam.title}</h4>
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${colorClass}`}>
          {exam.groupName}
        </span>
      </div>

      {/* Date */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Calendar className="h-3.5 w-3.5 text-slate-400" />
        {formatDate(exam.date)}
      </div>

      {/* Avg Score */}
      {hasResults ? (
        <>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold text-slate-900">{avgScore}</span>
            <span className="text-sm text-slate-400 mb-1">/ {exam.maxScore}</span>
            <span className="ml-auto text-xs text-slate-400 mb-1">{Math.round(pct)}%</span>
          </div>

          {/* Score bar */}
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${barColor} rounded-full transition-all`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      ) : (
        <p className="text-xs text-slate-400 italic">Results not yet entered</p>
      )}

      {/* Action */}
      <div className="pt-1">
        <Button
          variant={isActive ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => onEnterResults(exam)}
          className="w-full"
        >
          {hasResults ? (
            <>
              <BarChart3 className="h-3.5 w-3.5" />
              {isActive ? 'Close Results' : 'View Results'}
            </>
          ) : (
            <>
              <ClipboardCheck className="h-3.5 w-3.5" />
              {isActive ? 'Close Panel' : 'Enter Results'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ExamsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<CreateFormValues>(EMPTY_FORM);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);

  const upcomingExams = TEACHER_EXAMS.filter((e) => e.status === 'upcoming') as Array<
    Exam & { status: 'upcoming' }
  >;
  const completedExams = TEACHER_EXAMS.filter((e) => e.status === 'completed') as Array<
    Exam & { status: 'completed' }
  >;

  // Stats
  const upcomingCount = upcomingExams.length;
  const completedCount = completedExams.length;
  const avgScoreAcrossCompleted = (() => {
    const withScores = completedExams.filter(
      (e) => typeof (e as { avgScore?: number }).avgScore === 'number'
    );
    if (withScores.length === 0) return 0;
    const sum = withScores.reduce(
      (acc, e) => acc + ((e as { avgScore?: number }).avgScore ?? 0),
      0
    );
    return Math.round(sum / withScores.length);
  })();

  function handleFormChange(field: keyof CreateFormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSchedule() {
    setShowCreateForm(false);
    setForm(EMPTY_FORM);
  }

  function handleEnterResults(exam: Exam) {
    setActiveExam((prev) => (prev?.id === exam.id ? null : exam));
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Exams"
        subtitle="Schedule and manage student exams"
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setShowCreateForm((v) => !v);
              setActiveExam(null);
            }}
          >
            <Plus className="h-4 w-4" />
            Create Exam
          </Button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Upcoming Exams"
          value={upcomingCount}
          icon={<Calendar className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label="Completed Exams"
          value={completedCount}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Average Score"
          value={avgScoreAcrossCompleted > 0 ? `${avgScoreAcrossCompleted}%` : '—'}
          icon={<BarChart3 className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
      </div>

      {/* Create Exam Form */}
      {showCreateForm && (
        <Card title="Schedule New Exam">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Exam Title
              </label>
              <Input
                placeholder="e.g. Algebra A1 Mid-Term Exam"
                value={form.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
              />
            </div>

            {/* Group */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Group
              </label>
              <Select
                value={form.groupId}
                onChange={(e) => handleFormChange('groupId', e.target.value)}
                placeholder="Select a group"
                className="w-full"
                options={TEACHER_GROUPS.map((g) => ({
                  value: g.id,
                  label: g.name,
                }))}
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Date
              </label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => handleFormChange('date', e.target.value)}
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Start Time
              </label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => handleFormChange('startTime', e.target.value)}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Duration (minutes)
              </label>
              <Input
                type="number"
                min={15}
                placeholder="90"
                value={form.duration}
                onChange={(e) => handleFormChange('duration', e.target.value)}
              />
            </div>

            {/* Room */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Room
              </label>
              <Input
                placeholder="e.g. Exam Hall A"
                value={form.room}
                onChange={(e) => handleFormChange('room', e.target.value)}
              />
            </div>

            {/* Max Score */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Max Score
              </label>
              <Input
                type="number"
                min={1}
                placeholder="100"
                value={form.maxScore}
                onChange={(e) => handleFormChange('maxScore', e.target.value)}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateForm(false);
                setForm(EMPTY_FORM);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSchedule}
              disabled={!form.title || !form.groupId || !form.date}
            >
              <Calendar className="h-4 w-4" />
              Schedule Exam
            </Button>
          </div>
        </Card>
      )}

      {/* Upcoming Exams Section */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
          Upcoming Exams
          <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {upcomingCount}
          </span>
        </h2>

        {upcomingExams.length === 0 ? (
          <Card>
            <div className="text-center py-10 text-slate-400 text-sm">
              No upcoming exams scheduled.
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcomingExams.map((exam) => (
              <UpcomingExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        )}
      </section>

      {/* Completed Exams Section */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Completed Exams
          <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {completedCount}
          </span>
        </h2>

        {completedExams.length === 0 ? (
          <Card>
            <div className="text-center py-10 text-slate-400 text-sm">
              No completed exams yet.
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {completedExams.map((exam) => (
              <div key={exam.id}>
                <CompletedExamCard
                  exam={exam}
                  onEnterResults={handleEnterResults}
                  isActive={activeExam?.id === exam.id}
                />
                {activeExam?.id === exam.id && (
                  <ResultsPanel
                    exam={exam}
                    onClose={() => setActiveExam(null)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
