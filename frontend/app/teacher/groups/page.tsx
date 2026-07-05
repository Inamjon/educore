'use client';

import { useState } from 'react';
import { ChevronLeft, Users, Clock, MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import {
  TEACHER_GROUPS,
  TEACHER_ATTENDANCE,
  TEACHER_ASSIGNMENTS,
  TEACHER_GRADES,
} from '@/lib/teacher-data';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Group = (typeof TEACHER_GROUPS)[number];
type Tab = 'students' | 'attendance' | 'homework' | 'grades';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function levelVariant(level: string): 'success' | 'warning' | 'danger' {
  if (level === 'beginner') return 'success';
  if (level === 'intermediate') return 'warning';
  return 'danger';
}

// ─── Group Card ────────────────────────────────────────────────────────────────

function GroupCard({
  group,
  onOpen,
}: {
  group: Group;
  onOpen: (g: Group) => void;
}) {
  const fillPct = Math.round((group.studentCount / group.capacity) * 100);

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col"
      style={{ borderTop: `4px solid ${group.courseColor}` }}
    >
      {/* Header */}
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">{group.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{group.courseName}</p>
          </div>
          <Badge label={group.level} variant={levelVariant(group.level)} />
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 pt-4 space-y-3">
        {/* Student count + progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {group.studentCount} / {group.capacity} students
            </span>
            <span className="text-xs text-slate-400">
              Next:{' '}
              <span className="font-medium text-slate-700">{formatDate(group.nextLesson)}</span>
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-indigo-500 transition-all"
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>

        {/* Days + time */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <span>{group.days.join(', ')}</span>
          <span className="text-slate-300">·</span>
          <span>
            {group.startTime} – {group.endTime}
          </span>
        </div>

        {/* Room */}
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <span className="text-xs font-medium text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">
            {group.room}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 pt-4 mt-auto">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onOpen(group)}
        >
          Open Group
        </Button>
      </div>
    </div>
  );
}

// ─── Detail Panel ──────────────────────────────────────────────────────────────

function GroupDetailPanel({
  group,
  onBack,
}: {
  group: Group;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('students');

  const groupAttendance = TEACHER_ATTENDANCE.filter((a) => a.groupId === group.id);
  const groupAssignments = TEACHER_ASSIGNMENTS.filter((a) => a.groupId === group.id);
  const groupGrades = TEACHER_GRADES.filter((g) => g.groupId === group.id);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'students', label: 'Students' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'homework', label: 'Homework' },
    { key: 'grades', label: 'Grades' },
  ];

  return (
    <Card className="mt-6" noPadding>
      {/* Panel Header */}
      <div
        className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 rounded-t-2xl"
        style={{ borderTop: `4px solid ${group.courseColor}` }}
      >
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-base font-bold text-slate-900">{group.name}</h2>
          <p className="text-xs text-slate-500">{group.courseName}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 px-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'students' && (
          <StudentsTab group={group} />
        )}
        {activeTab === 'attendance' && (
          <AttendanceTab records={groupAttendance} />
        )}
        {activeTab === 'homework' && (
          <HomeworkTab assignments={groupAssignments} />
        )}
        {activeTab === 'grades' && (
          <GradesTab grades={groupGrades} />
        )}
      </div>
    </Card>
  );
}

// ─── Students Tab ──────────────────────────────────────────────────────────────

function StudentsTab({ group }: { group: Group }) {
  const students = TEACHER_GRADES.filter((g) => g.groupId === group.id);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px]">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">
              Student
            </th>
            <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">
              Attendance
            </th>
            <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">
              Avg Grade
            </th>
            <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {group.students.map((s) => {
            const gradeRecord = students.find((g) => g.studentId === s.id);
            return (
              <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} size="sm" />
                    <span className="text-sm font-medium text-slate-800">{s.name}</span>
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-indigo-500"
                        style={{ width: `${s.attendanceRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 font-medium">{s.attendanceRate}%</span>
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  <span className="text-sm font-semibold text-slate-800">
                    {gradeRecord ? `${gradeRecord.finalGrade} (${gradeRecord.letterGrade})` : `${s.avgGrade}`}
                  </span>
                </td>
                <td className="py-3.5 px-3">
                  <StatusBadge status={s.attendanceRate >= 70 ? 'active' : 'inactive'} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Attendance Tab ────────────────────────────────────────────────────────────

function AttendanceTab({
  records,
}: {
  records: typeof TEACHER_ATTENDANCE;
}) {
  return (
    <div className="overflow-x-auto">
      {records.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No attendance records found.</p>
      ) : (
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">
                Student
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">
                Date
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">
                Status
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">
                Note
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => (
              <tr
                key={rec.id}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
              >
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={rec.studentName} size="sm" />
                    <span className="text-sm text-slate-700">{rec.studentName}</span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-sm text-slate-600">{formatDate(rec.date)}</td>
                <td className="py-3.5 px-3">
                  <StatusBadge status={rec.status} />
                </td>
                <td className="py-3.5 px-3 text-xs text-slate-400">
                  {'note' in rec ? rec.note ?? '—' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Homework Tab ──────────────────────────────────────────────────────────────

function HomeworkTab({
  assignments,
}: {
  assignments: typeof TEACHER_ASSIGNMENTS;
}) {
  return (
    <div className="space-y-3">
      {assignments.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No assignments for this group.</p>
      ) : (
        assignments.map((asgn) => (
          <div
            key={asgn.id}
            className="rounded-xl border border-slate-100 p-4 hover:border-indigo-100 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{asgn.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{asgn.description}</p>
              </div>
              <StatusBadge status={asgn.status} />
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
              <span>Due: <span className="font-medium text-slate-700">{formatDate(asgn.dueDate)}</span></span>
              <span className="text-slate-300">·</span>
              <span className="text-emerald-600 font-medium">✓ {asgn.submitted} submitted</span>
              <span className="text-amber-600 font-medium">⏳ {asgn.pending} pending</span>
              {asgn.late > 0 && (
                <span className="text-red-500 font-medium">⚠ {asgn.late} late</span>
              )}
              <span className="text-slate-400">Max: {asgn.maxScore}pts</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Grades Tab ────────────────────────────────────────────────────────────────

function GradesTab({ grades }: { grades: typeof TEACHER_GRADES }) {
  return (
    <div className="overflow-x-auto">
      {grades.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No grade records found.</p>
      ) : (
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">
                Student
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">
                Assignments
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">
                Exams
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">
                Participation
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">
                Final Grade
              </th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">
                Trend
              </th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g) => (
              <tr
                key={g.id}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
              >
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={g.studentName} size="sm" />
                    <span className="text-sm font-medium text-slate-800">{g.studentName}</span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-sm text-slate-600">{g.assignmentScore}</td>
                <td className="py-3.5 px-3 text-sm text-slate-600">{g.examScore}</td>
                <td className="py-3.5 px-3 text-sm text-slate-600">{g.participation}</td>
                <td className="py-3.5 px-3">
                  <span className="text-sm font-bold text-slate-900">{g.finalGrade}</span>
                  <span className="ml-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full px-1.5 py-0.5">
                    {g.letterGrade}
                  </span>
                </td>
                <td className="py-3.5 px-3">
                  {g.trend === 'up' && (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  )}
                  {g.trend === 'down' && (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  {g.trend === 'stable' && (
                    <Minus className="h-4 w-4 text-slate-400" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeacherGroupsPage() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  function handleOpen(group: Group) {
    setSelectedGroup(group);
    // Scroll to detail panel after state update
    setTimeout(() => {
      document.getElementById('group-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function handleBack() {
    setSelectedGroup(null);
  }

  return (
    <div>
      <PageHeader
        title="My Groups"
        subtitle={`${TEACHER_GROUPS.length} active groups`}
      />

      {/* Group Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {TEACHER_GROUPS.map((group) => (
          <GroupCard key={group.id} group={group} onOpen={handleOpen} />
        ))}
      </div>

      {/* Detail Panel */}
      {selectedGroup && (
        <div id="group-detail">
          <GroupDetailPanel group={selectedGroup} onBack={handleBack} />
        </div>
      )}
    </div>
  );
}
