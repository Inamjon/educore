'use client';

import { Fragment, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { SearchInput, Input, Select } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat-card';
import { useAuthStore } from '@/lib/store/auth-store';
import { useMyTeacherProfileQuery } from '@/lib/queries/teachers';
import { useGroupsQuery, useGroupMembersQuery } from '@/lib/queries/groups';
import {
  useAssignmentsQuery,
  useSubmissionsQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useGradeSubmissionMutation,
} from '@/lib/queries/homework';
import type { Assignment, AssignmentStatus } from '@/lib/api/homework';
import { ApiError } from '@/lib/api/client';
import { toast } from '@/lib/store/toast-store';
import {
  Plus,
  Calendar,
  FileText,
  ClipboardList,
  AlertCircle,
  Clock,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Edit2,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'submitted' | 'pending' | 'late';
type SubmissionStatus = 'graded' | 'late' | 'submitted';

interface GradeState {
  [submissionId: string]: { score: string; feedback: string; feedbackOpen: boolean };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
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

const GROUP_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-cyan-100 text-cyan-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
];

function groupColor(groupId: string): string {
  let hash = 0;
  for (let i = 0; i < groupId.length; i++) hash = (hash + groupId.charCodeAt(i)) % GROUP_COLORS.length;
  return GROUP_COLORS[hash];
}

// ─── Create/Edit Form ──────────────────────────────────────────────────────────

interface FormValues {
  title: string;
  groupId: string;
  description: string;
  dueDate: string;
  maxScore: string;
  status: AssignmentStatus;
}

const EMPTY_FORM: FormValues = {
  title: '',
  groupId: '',
  description: '',
  dueDate: '',
  maxScore: '100',
  status: 'active',
};

// ─── Submissions Panel ─────────────────────────────────────────────────────────

interface SubmissionsPanelProps {
  assignment: Assignment;
  organizationId: string;
  onClose: () => void;
}

function SubmissionsPanel({ assignment, organizationId, onClose }: SubmissionsPanelProps) {
  const { data: submissions = [] } = useSubmissionsQuery({ organizationId, assignment: assignment.id });
  const { data: members = [] } = useGroupMembersQuery(assignment.group);
  const gradeMutation = useGradeSubmissionMutation();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [grades, setGrades] = useState<GradeState>({});

  function statusOf(sub: (typeof submissions)[number]): SubmissionStatus {
    if (sub.score !== null) return 'graded';
    if (sub.is_late) return 'late';
    return 'submitted';
  }

  function gradeFor(id: string) {
    return grades[id] ?? { score: '', feedback: '', feedbackOpen: false };
  }

  const submittedStudentIds = new Set(submissions.map((s) => s.student_profile));
  const pendingStudents = members.filter((m) => m.status === 'active' && !submittedStudentIds.has(m.student_profile));

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: submissions.length + pendingStudents.length },
    { key: 'submitted', label: 'Submitted', count: submissions.filter((s) => statusOf(s) === 'submitted').length },
    { key: 'pending', label: 'Pending', count: pendingStudents.length },
    { key: 'late', label: 'Late', count: submissions.filter((s) => statusOf(s) === 'late').length },
  ];

  const filtered =
    activeTab === 'all' ? submissions : activeTab === 'pending' ? [] : submissions.filter((s) => statusOf(s) === activeTab);

  function handleScore(id: string, value: string) {
    setGrades((prev) => ({ ...prev, [id]: { ...gradeFor(id), score: value } }));
  }

  function handleFeedback(id: string, value: string) {
    setGrades((prev) => ({ ...prev, [id]: { ...gradeFor(id), feedback: value } }));
  }

  function toggleFeedback(id: string) {
    setGrades((prev) => ({ ...prev, [id]: { ...gradeFor(id), feedbackOpen: !gradeFor(id).feedbackOpen } }));
  }

  async function handleSave() {
    const toSave = submissions.filter((sub) => {
      const g = grades[sub.id];
      return g && g.score !== '' && !isNaN(Number(g.score));
    });
    if (toSave.length === 0) {
      toast.error('Enter a score for at least one student first.');
      return;
    }
    try {
      await Promise.all(
        toSave.map((sub) => {
          const g = grades[sub.id];
          return gradeMutation.mutateAsync({ id: sub.id, score: Number(g.score), feedback: g.feedback || undefined });
        })
      );
      toast.success('Grades saved successfully');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
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
                activeTab === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
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
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">Student</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">Submitted</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">Score</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">Status</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">Feedback</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (activeTab !== 'all' && activeTab !== 'pending' ? true : pendingStudents.length === 0) && submissions.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-slate-400 text-sm py-12">
                  No submissions yet.
                </td>
              </tr>
            )}
            {filtered.map((sub) => (
              <Fragment key={sub.id}>
                <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={sub.student_name} size="sm" />
                      <span className="text-sm font-medium text-slate-800">{sub.student_name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-slate-500">{formatDateTime(sub.submitted_at)}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={assignment.max_score}
                        value={gradeFor(sub.id).score || (sub.score !== null ? String(sub.score) : '')}
                        onChange={(e) => handleScore(sub.id, e.target.value)}
                        className="w-16 h-8 rounded-lg border border-slate-200 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-slate-400">/ {assignment.max_score}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={statusOf(sub)} />
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => toggleFeedback(sub.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {gradeFor(sub.id).feedbackOpen ? 'Hide' : sub.feedback ? 'Edit Feedback' : 'Add Feedback'}
                    </button>
                  </td>
                </tr>
                {gradeFor(sub.id).feedbackOpen && (
                  <tr className="border-b border-slate-50">
                    <td colSpan={5} className="px-4 pb-3">
                      <textarea
                        value={gradeFor(sub.id).feedback || sub.feedback || ''}
                        onChange={(e) => handleFeedback(sub.id, e.target.value)}
                        placeholder="Add feedback for this student..."
                        className="rounded-xl border border-slate-200 w-full p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={2}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {(activeTab === 'all' || activeTab === 'pending') &&
              pendingStudents.map((member) => (
                <tr key={member.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.student_name} size="sm" />
                      <span className="text-sm font-medium text-slate-800">{member.student_name}</span>
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
      <div className="flex items-center justify-end mt-6 pt-4 border-t border-slate-100">
        <Button variant="primary" onClick={handleSave} loading={gradeMutation.isPending}>
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
  onEdit: (a: Assignment) => void;
}

function AssignmentCard({ assignment, onViewSubmissions, onEdit }: AssignmentCardProps) {
  const total = assignment.total_students;
  const submittedPct = total > 0 ? (assignment.submitted_count / total) * 100 : 0;
  const pending = Math.max(total - assignment.submitted_count, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-bold text-slate-900 text-sm leading-tight flex-1">{assignment.title}</h4>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${groupColor(assignment.group)}`}>
            {assignment.group_name}
          </span>
          <StatusBadge status={assignment.status} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Calendar className="h-3.5 w-3.5 text-slate-400" />
        <span>Due {formatDate(assignment.due_date)}</span>
      </div>

      {assignment.description && <p className="text-xs text-slate-500 line-clamp-2">{assignment.description}</p>}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
          <CheckCircle2 className="h-3 w-3" />
          {assignment.submitted_count} Submitted
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
          <Clock className="h-3 w-3" />
          {pending} Pending
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
          <CheckCircle2 className="h-3 w-3" />
          {assignment.graded_count} Graded
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span>Submissions</span>
          <span>{assignment.submitted_count}/{total}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${submittedPct}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={() => onViewSubmissions(assignment)}>
          <FileText className="h-3.5 w-3.5" />
          View Submissions
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(assignment)}>
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AssignmentsPage() {
  const organizationId = useAuthStore((s) => s.user?.organizationId) ?? '';
  const { data: myProfile } = useMyTeacherProfileQuery();
  const { data: groups = [] } = useGroupsQuery({ organizationId, teacher: myProfile?.id });
  const { data: assignments = [] } = useAssignmentsQuery({ organizationId });
  const createMutation = useCreateAssignmentMutation();
  const updateMutation = useUpdateAssignmentMutation();

  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [saving, setSaving] = useState(false);

  const totalAssignments = assignments.length;
  const pendingSubmissions = assignments.reduce((sum, a) => sum + Math.max(a.total_students - a.submitted_count, 0), 0);
  const gradedSubmissions = assignments.reduce((sum, a) => sum + a.graded_count, 0);

  const filtered = assignments.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.group_name.toLowerCase().includes(search.toLowerCase())
  );

  function handleFormChange<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmitForm() {
    if (!form.title || !form.groupId || !form.dueDate) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          input: {
            title: form.title,
            description: form.description,
            dueDate: form.dueDate,
            maxScore: Number(form.maxScore) || 100,
            status: form.status,
          },
        });
        toast.success('Assignment updated');
      } else {
        await createMutation.mutateAsync({
          organizationId,
          group: form.groupId,
          title: form.title,
          description: form.description,
          dueDate: form.dueDate,
          maxScore: Number(form.maxScore) || 100,
        });
        toast.success('Assignment created');
      }
      setShowCreateForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(assignment: Assignment) {
    setEditingId(assignment.id);
    setForm({
      title: assignment.title,
      groupId: assignment.group,
      description: assignment.description ?? '',
      dueDate: assignment.due_date,
      maxScore: String(assignment.max_score),
      status: assignment.status,
    });
    setActiveAssignment(null);
    setShowCreateForm(true);
  }

  function handleViewSubmissions(assignment: Assignment) {
    setActiveAssignment((prev) => (prev?.id === assignment.id ? null : assignment));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        subtitle="Manage and grade student assignments"
        actions={
          <>
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assignments..." />
            <Button
              variant="primary"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Assignments" value={totalAssignments} icon={<ClipboardList className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Pending Submissions" value={pendingSubmissions} icon={<Clock className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
        <StatCard label="Graded Submissions" value={gradedSubmissions} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
      </div>

      {showCreateForm && (
        <Card title={editingId ? 'Edit Assignment' : 'Create New Assignment'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Assignment Title</label>
              <Input
                placeholder="e.g. Polynomial Expressions Worksheet"
                value={form.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Group</label>
              <Select
                value={form.groupId}
                onChange={(e) => handleFormChange('groupId', e.target.value)}
                placeholder="Select a group"
                className="w-full"
                disabled={!!editingId}
                options={groups.map((g) => ({ value: g.id, label: g.name }))}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Deadline</label>
              <Input type="date" value={form.dueDate} onChange={(e) => handleFormChange('dueDate', e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Max Score</label>
              <Input
                type="number"
                min={1}
                placeholder="100"
                value={form.maxScore}
                onChange={(e) => handleFormChange('maxScore', e.target.value)}
              />
            </div>

            {editingId && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
                <Select
                  value={form.status}
                  onChange={(e) => handleFormChange('status', e.target.value as AssignmentStatus)}
                  className="w-full"
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'closed', label: 'Closed' },
                  ]}
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
              <textarea
                placeholder="Describe the assignment tasks and instructions..."
                value={form.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                className="rounded-xl border border-slate-200 w-full p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center justify-end mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmitForm} disabled={!form.title || !form.groupId || !form.dueDate} loading={saving}>
                {editingId ? 'Save Changes' : 'Create'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-slate-400 text-sm">No assignments found.</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((assignment) => (
            <div key={assignment.id}>
              <AssignmentCard assignment={assignment} onViewSubmissions={handleViewSubmissions} onEdit={handleEdit} />
              {activeAssignment?.id === assignment.id && (
                <SubmissionsPanel
                  assignment={assignment}
                  organizationId={organizationId}
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
