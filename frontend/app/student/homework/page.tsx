'use client';

import { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  ClipboardList,
  AlertCircle,
  GraduationCap,
  Upload,
  MessageSquare,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { STUDENT_HOMEWORK } from '@/lib/student-data';

// ─── Types ────────────────────────────────────────────────────────────────────

type HomeworkStatus = 'pending' | 'submitted' | 'graded' | 'late';
type FilterTab = 'all' | HomeworkStatus;

interface Homework {
  id: string;
  title: string;
  groupId: string;
  groupName: string;
  courseColor: string;
  assignedDate: string;
  dueDate: string;
  description: string;
  maxScore: number;
  status: HomeworkStatus;
  score?: number;
  feedback?: string;
  submittedAt?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<HomeworkStatus, { label: string; variant: 'success' | 'info' | 'warning' | 'danger' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  submitted: { label: 'Submitted', variant: 'info' },
  graded: { label: 'Graded', variant: 'success' },
  late: { label: 'Late', variant: 'danger' },
};

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'graded', label: 'Graded' },
  { id: 'late', label: 'Late' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Homework Card ─────────────────────────────────────────────────────────────

function HomeworkCard({
  hw,
  onSubmit,
}: {
  hw: Homework;
  onSubmit: (id: string) => void;
}) {
  const config = STATUS_CONFIG[hw.status];
  const { score, feedback } = hw;

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3"
      style={{ borderLeft: `4px solid ${hw.courseColor}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-slate-900 text-sm leading-tight flex-1">{hw.title}</h4>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs font-medium px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${hw.courseColor}18`, color: hw.courseColor }}
          >
            {hw.groupName}
          </span>
          <Badge label={config.label} variant={config.variant} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Calendar className="h-3.5 w-3.5 text-slate-400" />
        <span>Due {formatDate(hw.dueDate)}</span>
        <span className="text-slate-300 mx-1">·</span>
        <span>Max {hw.maxScore} pts</span>
      </div>

      <p className="text-xs text-slate-500 line-clamp-2">{hw.description}</p>

      {hw.status === 'graded' && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-emerald-700">{score}</span>
            <span className="text-xs text-emerald-600">/ {hw.maxScore}</span>
          </div>
          {feedback && (
            <div className="flex items-start gap-1.5 border-l border-emerald-200 pl-3 flex-1 min-w-0">
              <MessageSquare className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700 leading-snug">{feedback}</p>
            </div>
          )}
        </div>
      )}

      {hw.status === 'submitted' && (
        <p className="text-xs text-blue-600 bg-blue-50 rounded-xl p-3">
          Submitted, awaiting grading.
        </p>
      )}

      {(hw.status === 'pending' || hw.status === 'late') && (
        <div className="pt-1">
          <Button
            variant={hw.status === 'late' ? 'outline' : 'primary'}
            size="sm"
            onClick={() => onSubmit(hw.id)}
          >
            <Upload className="h-3.5 w-3.5" />
            {hw.status === 'late' ? 'Submit Late' : 'Submit Homework'}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentHomeworkPage() {
  const [homework, setHomework] = useState<Homework[]>(STUDENT_HOMEWORK as Homework[]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filtered = useMemo(
    () => (activeTab === 'all' ? homework : homework.filter((h) => h.status === activeTab)),
    [homework, activeTab]
  );

  const pendingCount = homework.filter((h) => h.status === 'pending' || h.status === 'late').length;
  const submittedCount = homework.filter((h) => h.status === 'submitted').length;
  const gradedItems = homework.filter((h) => h.status === 'graded' && h.score !== undefined);
  const avgScore =
    gradedItems.length > 0
      ? Math.round(
          gradedItems.reduce((sum, h) => sum + ((h.score! / h.maxScore) * 100), 0) / gradedItems.length
        )
      : 0;

  function handleSubmit(id: string) {
    setHomework((prev) =>
      prev.map((h) => (h.id === id ? { ...h, status: 'submitted' as const, submittedAt: new Date().toISOString() } : h))
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Homework" subtitle="Track and submit your assignments" />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pending"
          value={pendingCount}
          icon={<ClipboardList className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
        <StatCard
          label="Awaiting Grading"
          value={submittedCount}
          icon={<Clock className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          label="Average Score"
          value={avgScore > 0 ? `${avgScore}%` : '—'}
          icon={<GraduationCap className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-100 overflow-x-auto pb-px">
        {FILTER_TABS.map((tab) => {
          const count = tab.id === 'all' ? homework.length : homework.filter((h) => h.status === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
              }`}
            >
              {tab.label}
              <span
                className={`inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-semibold ${
                  activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Homework Grid */}
      {filtered.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <AlertCircle className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No homework in this category</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((hw) => (
            <HomeworkCard key={hw.id} hw={hw} onSubmit={handleSubmit} />
          ))}
        </div>
      )}
    </div>
  );
}
