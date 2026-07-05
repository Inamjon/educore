'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { SearchInput, Input, Select } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable, Column } from '@/components/ui/data-table';
import {
  TEACHER_ASSIGNMENTS,
  TEACHER_SUBMISSIONS,
  TEACHER_GROUPS,
} from '@/lib/teacher-data';
import {
  Plus,
  Calendar,
  FileText,
  ClipboardList,
  AlertCircle,
  Clock,
  ChevronLeft,
  Paperclip,
  CheckCircle2,
  XCircle,
  Edit2,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Assignment = (typeof TEACHER_ASSIGNMENTS)[number];
type Submission = (typeof TEACHER_SUBMISSIONS)[number];

type FilterTab = 'all' | 'submitted' | 'pending' | 'late';

interface GradeState {
  [submissionId: string]: { score: string; feedback: string; feedbackOpen: boolean };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Group badge colors ────────────────────────────────────────────────────────

const GROUP_COLORS: Record<string, string> = {
  g1: 'bg-indigo-100 text-indigo-700',
  g2: 'bg-violet-100 text-violet-700',
  g3: 'bg-cyan-100 text-cyan-700',
};

// ─── Create Form ───────────────────────────────────────────────────────────────

interface CreateFormValues {
  title: string;
  groupId: string;
  description: string;
  dueDate: string;
  maxScore: string;
}

const EMPTY_FORM: CreateFormValues = {
  title: '',
  groupId: '',
  description: '',
  dueDate: '',
  maxScore: '100',
};

// ─── Submissions Panel ─────────────────────────────────────────────────────────

interface SubmissionsPanelProps {
  assignment: Assignment;
  onClose: () => void;
}

function SubmissionsPanel({ assignment, onClose }: SubmissionsPanelProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [grades, setGrades] = useState<GradeState>(() => {
    const init: GradeState = {};
    TEACHER_SUBMISSIONS.filter((s) => s.assignmentId === assignment.id).forEach((s) => {
      init[s.id] = {
        score: s.score !== undefined ? String(s.score) : '',
        feedback: s.feedback ?? '',
        feedbackOpen: false,
      };
    });
    return init;
  });
  const [saved, setSaved] = useState(false);

  const allSubs = TEACHER_SUBMISSIONS.filter((s) => s.assignmentId === assignment.id);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: allSubs.length },
    { key: 'submitted', label: 'Submitted', count: allSubs.filter((s) => s.status === 'submitted').length },
    { key: 'pending', label: 'Pending', count: allSubs.filter((s) => (s.status as string) === 'pending').length },
    { key: 'late', label: 'Late', count: allSubs.filter((s) => s.status === 'late').length },
  ];

  const filtered =
    activeTab === 'all' ? allSubs : allSubs.filter((s) => (s.status as string) === activeTab);

  function handleScore(id: string, value: string) {
    setGrades((prev) => ({ ...prev, [id]: { ...prev[id], score: value } }));
    setSaved(false);
  }

  function handleFeedback(id: string, value: string) {
    setGrades((prev) => ({ ...prev, [id]: { ...prev[id], feedback: value } }));
    setSaved(false);
  }

  function toggleFeedback(id: string) {
    setGrades((prev) => ({
      ...prev,
      [id]: { ...prev[id], feedbackOpen: !prev[id]?.feedbackOpen },
    }));
  }

  function handleSave() {
    setSaved(true);
  }

  // Build pending students (not yet in TEACHER_SUBMISSIONS)
  const submittedStudentIds = new Set(allSubs.map((s) => s.studentId));
  const group = TEACHER_GROUPS.find((g) => g.id === assignment.groupId);
  const pendingStudents = (group?.students ?? []).filter(
    (s) => !submittedStudentIds.has(s.id)
  );

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
            <h3 className="font-semibold text-slate-900">{assignment.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Submissions Panel</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <XCircle className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-100 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">
                Student
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">
                Submitted
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">
                Score
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">
                Status
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">
                Feedback
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && pendingStudents.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-slate-400 text-sm py-12">
                  No submissions yet.
                </td>
              </tr>
            )}
            {filtered.map((sub) => (
              <>
                <tr
                  key={sub.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={sub.studentName} size="sm" />
                      <span className="text-sm font-medium text-slate-800">
                        {sub.studentName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-slate-500">
                    {formatDateTime(sub.submittedAt)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={assignment.maxScore}
                        value={grades[sub.id]?.score ?? ''}
                        onChange={(e) => handleScore(sub.id, e.target.value)}
                        className="w-16 h-8 rounded-lg border border-slate-200 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-slate-400">/ {assignment.maxScore}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => toggleFeedback(sub.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {grades[sub.id]?.feedbackOpen ? 'Hide' : 'Add Feedback'}
                    </button>
                  </td>
                </tr>
                {grades[sub.id]?.feedbackOpen && (
                  <tr key={`${sub.id}-feedback`} className="border-b border-slate-50">
                    <td colSpan={5} className="px-4 pb-3">
                      <textarea
                        value={grades[sub.id]?.feedback ?? ''}
                        onChange={(e) => handleFeedback(sub.id, e.target.value)}
                        placeholder="Add feedback for this student..."
                        className="rounded-xl border border-slate-200 w-full p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={2}
                      />
                    </td>
                  </tr>
                )}
              </>
            ))}
            {/* Pending students not in submissions list */}
            {(activeTab === 'all' || activeTab === 'pending') &&
              pendingStudents.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={student.name} size="sm" />
                      <span className="text-sm font-medium text-slate-800">{student.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-slate-400">—</td>
                  <td className="py-3.5 px-4 text-sm text-slate-400">—</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status="pending" />
                  </td>
                  <td className="py-3.5 px-4 text-sm text-slate-400">—</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Grades saved successfully
          </span>
        )}
        {!saved && <span />}
        <Button variant="primary" onClick={handleSave}>
          Save Grades
        </Button>
      </div>
    </Card>
  );
}

// ─── Assignment Card ───────────────────────────────────────────────────────────

interface AssignmentCardProps {
  assignment: Assignment;
  onViewSubmissions: (a: Assignment) => void;
}

function AssignmentCard({ assignment, onViewSubmissions }: AssignmentCardProps) {
  const total = assignment.totalStudents;
  const submittedPct = total > 0 ? (assignment.submitted / total) * 100 : 0;
  const colorClass = GROUP_COLORS[assignment.groupId] ?? 'bg-slate-100 text-slate-700';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-slate-900 text-sm leading-tight flex-1">
          {assignment.title}
        </h4>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${colorClass}`}>
            {assignment.groupName}
          </span>
          <StatusBadge status={assignment.status} />
        </div>
      </div>

      {/* Due date */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Calendar className="h-3.5 w-3.5 text-slate-400" />
        <span>Due {formatDate(assignment.dueDate)}</span>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 line-clamp-2">{assignment.description}</p>

      {/* Submission pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
          <CheckCircle2 className="h-3 w-3" />
          {assignment.submitted} Submitted
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
          <Clock className="h-3 w-3" />
          {assignment.pending} Pending
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-50 text-red-600 px-2.5 py-1 rounded-full">
          <AlertCircle className="h-3 w-3" />
          {assignment.late} Late
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span>Submissions</span>
          <span>
            {assignment.submitted}/{total}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${submittedPct}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewSubmissions(assignment)}
        >
          <FileText className="h-3.5 w-3.5" />
          View Submissions
        </Button>
        <Button variant="ghost" size="sm">
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AssignmentsPage() {
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<CreateFormValues>(EMPTY_FORM);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);

  // Stats
  const totalAssignments = TEACHER_ASSIGNMENTS.length;
  const pendingSubmissions = TEACHER_ASSIGNMENTS.reduce((sum, a) => sum + a.pending, 0);
  const lateSubmissions = TEACHER_ASSIGNMENTS.reduce((sum, a) => sum + a.late, 0);

  // Filtered assignments
  const filtered = TEACHER_ASSIGNMENTS.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.groupName.toLowerCase().includes(search.toLowerCase())
  );

  function handleFormChange(field: keyof CreateFormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleCreate() {
    // In a real app, would persist the new assignment
    setShowCreateForm(false);
    setForm(EMPTY_FORM);
  }

  function handleViewSubmissions(assignment: Assignment) {
    setActiveAssignment((prev) =>
      prev?.id === assignment.id ? null : assignment
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Assignments"
        subtitle="Manage and grade student assignments"
        actions={
          <>
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assignments..."
            />
            <Button
              variant="primary"
              onClick={() => {
                setShowCreateForm((v) => !v);
                setActiveAssignment(null);
              }}
            >
              <Plus className="h-4 w-4" />
              Create Assignment
            </Button>
          </>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Assignments"
          value={totalAssignments}
          icon={<ClipboardList className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label="Pending Submissions"
          value={pendingSubmissions}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
        <StatCard
          label="Late Submissions"
          value={lateSubmissions}
          icon={<AlertCircle className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-50"
        />
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card title="Create New Assignment">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Assignment Title
              </label>
              <Input
                placeholder="e.g. Polynomial Expressions Worksheet"
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

            {/* Deadline */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Deadline
              </label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => handleFormChange('dueDate', e.target.value)}
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

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Description
              </label>
              <textarea
                placeholder="Describe the assignment tasks and instructions..."
                value={form.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                className="rounded-xl border border-slate-200 w-full p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
            <Button variant="ghost" size="sm">
              <Paperclip className="h-4 w-4" />
              Attach File
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setForm(EMPTY_FORM);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreate} disabled={!form.title || !form.groupId}>
                Create
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Assignments Grid */}
      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-slate-400 text-sm">
            No assignments found.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((assignment) => (
            <div key={assignment.id}>
              <AssignmentCard
                assignment={assignment}
                onViewSubmissions={handleViewSubmissions}
              />
              {/* Submissions panel appears below the clicked card */}
              {activeAssignment?.id === assignment.id && (
                <SubmissionsPanel
                  assignment={assignment}
                  onClose={() => setActiveAssignment(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
