'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Input, Select } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat-card';
import { TEACHER_GROUPS, TEACHER_STUDENTS } from '@/lib/teacher-data';
import { useTeacherExamsStore, type Exam, type NewExam } from '@/lib/store/teacher-exams-store';
import { toast } from '@/lib/store/toast-store';
import { formatLocalizedDate } from '@/i18n/date-locale';
import { isLocale, DEFAULT_LOCALE, type Locale } from '@/i18n/locales';
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

// ─── Constants ────────────────────────────────────────────────────────────────

const GROUP_COLORS: Record<string, string> = {
  g1: 'bg-indigo-100 text-indigo-700',
  g2: 'bg-violet-100 text-violet-700',
  g3: 'bg-cyan-100 text-cyan-700',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string, locale: Locale) {
  return formatLocalizedDate(new Date(dateStr + 'T00:00:00'), locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

function scoreBarColor(avg: number, max: number) {
  const pct = max > 0 ? (avg / max) * 100 : 0;
  if (pct > 80) return 'bg-emerald-500';
  if (pct > 60) return 'bg-amber-400';
  return 'bg-red-500';
}

// ─── Form ──────────────────────────────────────────────────────────────────────

interface FormValues {
  title: string;
  groupId: string;
  date: string;
  startTime: string;
  duration: string;
  room: string;
  maxScore: string;
}

const EMPTY_FORM: FormValues = {
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
  const t = useTranslations('TeacherExams');
  const savedResults = useTeacherExamsStore((s) => s.examResults[exam.id]);
  const saveResults = useTeacherExamsStore((s) => s.saveResults);
  const students = TEACHER_STUDENTS.filter((s) => s.groupId === exam.groupId);
  const [results, setResults] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    students.forEach((s) => {
      init[s.id] = savedResults?.[s.id] !== undefined ? String(savedResults[s.id]) : '';
    });
    return init;
  });

  const scores = Object.values(results).map(Number).filter((v) => !isNaN(v) && v > 0);
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  function handleScore(studentId: string, value: string) {
    setResults((prev) => ({ ...prev, [studentId]: value }));
  }

  function handleSave() {
    const numericResults: Record<string, number> = {};
    Object.entries(results).forEach(([studentId, value]) => {
      const n = Number(value);
      if (!isNaN(n) && n > 0) numericResults[studentId] = n;
    });
    saveResults(exam.id, numericResults);
    toast.success(t('resultsSavedToast'));
  }

  return (
    <Card className="mt-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h3 className="font-semibold text-slate-900">{exam.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{t('enterResultsSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {scores.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-400">{t('currentAverageLabel')}</p>
              <p className="text-lg font-bold text-indigo-600">
                {avg}<span className="text-sm font-normal text-slate-400">/{exam.maxScore}</span>
              </p>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">{t('colStudent')}</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">{t('colScore')}</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">{t('colGrade')}</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-slate-400 text-sm py-12">{t('noStudentsInGroup')}</td>
              </tr>
            )}
            {students.map((student) => {
              const scoreVal = Number(results[student.id]);
              const pct = exam.maxScore > 0 ? (scoreVal / exam.maxScore) * 100 : 0;
              const letterGrade =
                scoreVal === 0 ? '—' : pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';

              return (
                <tr key={student.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={student.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{student.name}</p>
                        <p className="text-xs text-slate-400">{student.loginId}</p>
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
                    <span className={`text-sm font-bold ${scoreVal === 0 ? 'text-slate-300' : pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                      {letterGrade}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
        <span className="text-xs text-slate-400">{t('studentsScored', { scored: scores.length, total: students.length })}</span>
        <Button variant="primary" onClick={handleSave}>
          {t('saveResultsButton')}
        </Button>
      </div>
    </Card>
  );
}

// ─── Upcoming Exam Card ────────────────────────────────────────────────────────

function UpcomingExamCard({
  exam,
  onEdit,
  onCancel,
}: {
  exam: Exam;
  onEdit: (exam: Exam) => void;
  onCancel: (id: string) => void;
}) {
  const t = useTranslations('TeacherExams');
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const colorClass = GROUP_COLORS[exam.groupId] ?? 'bg-slate-100 text-slate-700';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-indigo-500 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-slate-900 text-sm leading-tight flex-1">{exam.title}</h4>
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${colorClass}`}>{exam.groupName}</span>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" />{formatDate(exam.date, locale)}</span>
        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" />{exam.startTime}</span>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" />{exam.room}</span>
        <span className="flex items-center gap-1.5"><Timer className="h-3.5 w-3.5 text-slate-400" />{t('durationMinutes', { count: exam.duration })}</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Users className="h-3.5 w-3.5 text-slate-400" />
        <span>{t('totalStudents', { count: exam.totalStudents })}</span>
        <span className="text-slate-300 mx-1">·</span>
        <span>{t('questionsCount', { count: exam.questions })}</span>
        <span className="text-slate-300 mx-1">·</span>
        <span>{t('maxPtsLabel', { points: exam.maxScore })}</span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={() => onEdit(exam)}>
          <Edit2 className="h-3.5 w-3.5" />
          {t('editButton')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={() => onCancel(exam.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t('cancelButton')}
        </Button>
      </div>
    </div>
  );
}

// ─── Completed Exam Card ───────────────────────────────────────────────────────

function CompletedExamCard({
  exam,
  onEnterResults,
  isActive,
}: {
  exam: Exam;
  onEnterResults: (exam: Exam) => void;
  isActive: boolean;
}) {
  const t = useTranslations('TeacherExams');
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const avgScore = exam.avgScore ?? 0;
  const colorClass = GROUP_COLORS[exam.groupId] ?? 'bg-slate-100 text-slate-700';
  const barColor = scoreBarColor(avgScore, exam.maxScore);
  const pct = exam.maxScore > 0 ? (avgScore / exam.maxScore) * 100 : 0;
  const hasResults = avgScore > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-slate-900 text-sm leading-tight flex-1">{exam.title}</h4>
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${colorClass}`}>{exam.groupName}</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Calendar className="h-3.5 w-3.5 text-slate-400" />
        {formatDate(exam.date, locale)}
      </div>

      {hasResults ? (
        <>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold text-slate-900">{avgScore}</span>
            <span className="text-sm text-slate-400 mb-1">/ {exam.maxScore}</span>
            <span className="ml-auto text-xs text-slate-400 mb-1">{Math.round(pct)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
          </div>
        </>
      ) : (
        <p className="text-xs text-slate-400 italic">{t('resultsNotYetEntered')}</p>
      )}

      <div className="pt-1">
        <Button variant={isActive ? 'secondary' : 'outline'} size="sm" onClick={() => onEnterResults(exam)} className="w-full">
          {hasResults ? (
            <><BarChart3 className="h-3.5 w-3.5" />{isActive ? t('closeResultsButton') : t('viewResultsButton')}</>
          ) : (
            <><ClipboardCheck className="h-3.5 w-3.5" />{isActive ? t('closePanelButton') : t('enterResultsButton')}</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ExamsPage() {
  const t = useTranslations('TeacherExams');
  const exams = useTeacherExamsStore((s) => s.exams);
  const addExam = useTeacherExamsStore((s) => s.addExam);
  const updateExam = useTeacherExamsStore((s) => s.updateExam);
  const cancelExam = useTeacherExamsStore((s) => s.cancelExam);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);

  const activeExams = exams.filter((e) => !e.cancelled);
  const upcomingExams = activeExams.filter((e) => e.status === 'upcoming');
  const completedExams = activeExams.filter((e) => e.status === 'completed');

  const upcomingCount = upcomingExams.length;
  const completedCount = completedExams.length;
  const avgScoreAcrossCompleted = (() => {
    const withScores = completedExams.filter((e) => typeof e.avgScore === 'number' && e.avgScore > 0);
    if (withScores.length === 0) return 0;
    const sum = withScores.reduce((acc, e) => acc + (e.avgScore ?? 0), 0);
    return Math.round(sum / withScores.length);
  })();

  function handleFormChange(field: keyof FormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmitForm() {
    const group = TEACHER_GROUPS.find((g) => g.id === form.groupId);
    if (!group) return;

    if (editingId) {
      updateExam(editingId, {
        title: form.title,
        groupId: group.id,
        groupName: group.name,
        date: form.date,
        startTime: form.startTime,
        duration: Number(form.duration) || 90,
        room: form.room,
        maxScore: Number(form.maxScore) || 100,
      });
      toast.success(t('examUpdatedToast'));
    } else {
      const newExam: NewExam = {
        title: form.title,
        groupId: group.id,
        groupName: group.name,
        date: form.date,
        startTime: form.startTime,
        duration: Number(form.duration) || 90,
        room: form.room,
        maxScore: Number(form.maxScore) || 100,
        totalStudents: group.studentCount,
        questions: 0,
      };
      addExam(newExam);
      toast.success(t('examScheduledToast'));
    }
    setShowCreateForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleEdit(exam: Exam) {
    setEditingId(exam.id);
    setForm({
      title: exam.title,
      groupId: exam.groupId,
      date: exam.date,
      startTime: exam.startTime,
      duration: String(exam.duration),
      room: exam.room,
      maxScore: String(exam.maxScore),
    });
    setShowCreateForm(true);
  }

  function handleCancelExam(id: string) {
    cancelExam(id);
    toast.success(t('examCancelledToast'));
  }

  function handleEnterResults(exam: Exam) {
    setActiveExam((prev) => (prev?.id === exam.id ? null : exam));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditingId(null);
              setForm(EMPTY_FORM);
              setShowCreateForm((v) => !v);
              setActiveExam(null);
            }}
          >
            <Plus className="h-4 w-4" />
            {t('createExamButton')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t('statUpcomingExams')} value={upcomingCount} icon={<Calendar className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label={t('statCompletedExams')} value={completedCount} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label={t('statAverageScore')} value={avgScoreAcrossCompleted > 0 ? `${avgScoreAcrossCompleted}%` : '—'} icon={<BarChart3 className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
      </div>

      {showCreateForm && (
        <Card title={editingId ? t('editExamTitle') : t('scheduleNewExamTitle')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('fieldExamTitle')}</label>
              <Input placeholder={t('titlePlaceholder')} value={form.title} onChange={(e) => handleFormChange('title', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('fieldGroup')}</label>
              <Select
                value={form.groupId}
                onChange={(e) => handleFormChange('groupId', e.target.value)}
                placeholder={t('selectGroupPlaceholder')}
                className="w-full"
                options={TEACHER_GROUPS.map((g) => ({ value: g.id, label: g.name }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('fieldDate')}</label>
              <Input type="date" value={form.date} onChange={(e) => handleFormChange('date', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('fieldStartTime')}</label>
              <Input type="time" value={form.startTime} onChange={(e) => handleFormChange('startTime', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('fieldDuration')}</label>
              <Input type="number" min={15} placeholder="90" value={form.duration} onChange={(e) => handleFormChange('duration', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('fieldRoom')}</label>
              <Input placeholder={t('roomPlaceholder')} value={form.room} onChange={(e) => handleFormChange('room', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('fieldMaxScore')}</label>
              <Input type="number" min={1} placeholder="100" value={form.maxScore} onChange={(e) => handleFormChange('maxScore', e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateForm(false);
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
            >
              {t('cancelButton')}
            </Button>
            <Button variant="primary" onClick={handleSubmitForm} disabled={!form.title || !form.groupId || !form.date}>
              <Calendar className="h-4 w-4" />
              {editingId ? t('saveChangesButton') : t('scheduleExamButton')}
            </Button>
          </div>
        </Card>
      )}

      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
          {t('upcomingExamsSection')}
          <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{upcomingCount}</span>
        </h2>

        {upcomingExams.length === 0 ? (
          <Card><div className="text-center py-10 text-slate-400 text-sm">{t('noUpcomingExamsScheduled')}</div></Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcomingExams.map((exam) => (
              <UpcomingExamCard key={exam.id} exam={exam} onEdit={handleEdit} onCancel={handleCancelExam} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          {t('completedExamsSection')}
          <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{completedCount}</span>
        </h2>

        {completedExams.length === 0 ? (
          <Card><div className="text-center py-10 text-slate-400 text-sm">{t('noCompletedExamsYet')}</div></Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {completedExams.map((exam) => (
              <div key={exam.id}>
                <CompletedExamCard exam={exam} onEnterResults={handleEnterResults} isActive={activeExam?.id === exam.id} />
                {activeExam?.id === exam.id && <ResultsPanel exam={exam} onClose={() => setActiveExam(null)} />}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
