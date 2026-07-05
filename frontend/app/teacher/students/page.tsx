'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  ClipboardCheck,
  BarChart2,
  Mail,
  Phone,
  ChevronLeft,
  BookOpen,
  FileText,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { SearchInput, Select } from '@/components/ui/input';
import { TEACHER_STUDENTS, TEACHER_GROUPS, TEACHER_ATTENDANCE, TEACHER_GRADES } from '@/lib/teacher-data';

// ─── Types ────────────────────────────────────────────────────────────────────

type Student = (typeof TEACHER_STUDENTS)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getGroupColor(groupId: string): string {
  const colors: Record<string, string> = {
    g1: 'bg-indigo-50 text-indigo-700',
    g2: 'bg-violet-50 text-violet-700',
    g3: 'bg-cyan-50 text-cyan-700',
  };
  return colors[groupId] ?? 'bg-slate-100 text-slate-700';
}

// ─── Student Card ─────────────────────────────────────────────────────────────

function StudentCard({
  student,
  onViewProfile,
}: {
  student: Student;
  onViewProfile: (s: Student) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col items-center text-center gap-3">
      {/* Avatar */}
      <Avatar name={student.name} size="xl" />

      {/* Name + badges */}
      <div className="space-y-1.5">
        <p className="font-semibold text-slate-900 text-base">{student.name}</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getGroupColor(student.groupId)}`}
          >
            {student.groupName}
          </span>
          <StatusBadge status={student.status} />
        </div>
      </div>

      {/* Stats */}
      <div className="w-full space-y-2 text-left">
        {/* Attendance with progress bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Attendance</span>
            <span className="font-medium text-slate-700">{student.attendanceRate}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${student.attendanceRate}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Avg Grade</span>
          <span className="font-semibold text-slate-700">{student.avgGrade}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Last Active</span>
          <span className="text-slate-600">{formatDate(student.lastActive)}</span>
        </div>
      </div>

      {/* Contact */}
      <div className="w-full space-y-1">
        <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
          <Mail className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
          <span className="truncate">{student.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Phone className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
          <span>{student.phone}</span>
        </div>
      </div>

      {/* View Profile button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-1"
        onClick={() => onViewProfile(student)}
      >
        View Profile
      </Button>
    </div>
  );
}

// ─── Student Detail Panel ─────────────────────────────────────────────────────

function StudentDetailPanel({
  student,
  onBack,
}: {
  student: Student;
  onBack: () => void;
}) {
  const attendance = TEACHER_ATTENDANCE.filter((a) => a.studentId === student.id);
  const grades = TEACHER_GRADES.filter((g) => g.studentId === student.id);

  // Count assignment submissions related to this student
  const assignmentCount = grades.length;
  const examCount = grades.filter((g) => g.examScore > 0).length;

  const statusColors: Record<string, string> = {
    present: 'bg-emerald-100 text-emerald-700',
    absent: 'bg-red-100 text-red-600',
    late: 'bg-amber-100 text-amber-700',
    excused: 'bg-blue-100 text-blue-700',
  };

  return (
    <Card className="mt-6" noPadding>
      {/* Panel header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Avatar name={student.name} size="md" />
          <div>
            <p className="font-semibold text-slate-900">{student.name}</p>
            <p className="text-xs text-slate-500">{student.groupName}</p>
          </div>
        </div>
        <div className="ml-auto">
          <StatusBadge status={student.status} />
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Personal Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Personal Information
          </h4>

          <div className="space-y-3">
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={student.email} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={student.phone} />
            <InfoRow icon={<Users className="h-4 w-4" />} label="Group" value={student.groupName} />
            <InfoRow icon={<Users className="h-4 w-4" />} label="Parent" value={student.parentName} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Parent Phone" value={student.parentPhone} />
            <InfoRow icon={<ClipboardCheck className="h-4 w-4" />} label="Last Active" value={formatDate(student.lastActive)} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Notes</label>
            <textarea
              defaultValue={student.notes}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Right: Stats + History */}
        <div className="space-y-5">
          {/* Mini stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <MiniStat
              icon={<ClipboardCheck className="h-4 w-4 text-indigo-600" />}
              label="Attendance"
              value={`${student.attendanceRate}%`}
              bg="bg-indigo-50"
            />
            <MiniStat
              icon={<BarChart2 className="h-4 w-4 text-emerald-600" />}
              label="Avg Grade"
              value={`${student.avgGrade}%`}
              bg="bg-emerald-50"
            />
            <MiniStat
              icon={<FileText className="h-4 w-4 text-amber-600" />}
              label="Assignments"
              value={assignmentCount}
              bg="bg-amber-50"
            />
            <MiniStat
              icon={<BookOpen className="h-4 w-4 text-violet-600" />}
              label="Exams Graded"
              value={examCount}
              bg="bg-violet-50"
            />
          </div>

          {/* Attendance History */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Recent Attendance</h4>
            {attendance.length === 0 ? (
              <p className="text-sm text-slate-400">No attendance records.</p>
            ) : (
              <div className="space-y-1.5">
                {attendance.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusColors[rec.status] ?? 'bg-slate-100 text-slate-600'}`}
                      >
                        {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(rec.date)}</span>
                    </div>
                    {rec.note && (
                      <span className="text-xs text-slate-400 truncate max-w-[140px]">{rec.note}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignment Grades */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Assignment Grades</h4>
            {grades.length === 0 ? (
              <p className="text-sm text-slate-400">No grade records.</p>
            ) : (
              <div className="space-y-1.5">
                {grades.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <span className="text-xs text-slate-700">{g.subject}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Assign: {g.assignmentScore}</span>
                      <span className="text-xs text-slate-500">Exam: {g.examScore}</span>
                      <span className="font-semibold text-xs text-slate-900">{g.finalGrade}</span>
                      <Badge label={g.letterGrade} variant={g.letterGrade.startsWith('A') ? 'success' : g.letterGrade.startsWith('B') ? 'info' : g.letterGrade.startsWith('C') ? 'warning' : 'danger'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-400 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-slate-400 block">{label}</span>
        <span className="text-sm text-slate-700 font-medium">{value}</span>
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bg: string;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${bg} flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-bold text-slate-900 text-sm">{value}</p>
      </div>
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filtered = useMemo(() => {
    return TEACHER_STUDENTS.filter((s) => {
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());
      const matchGroup = !groupFilter || s.groupId === groupFilter;
      return matchSearch && matchGroup;
    });
  }, [search, groupFilter]);

  // Stats
  const totalStudents = TEACHER_STUDENTS.length;
  const avgAttendance = Math.round(
    TEACHER_STUDENTS.reduce((s, st) => s + st.attendanceRate, 0) / totalStudents
  );
  const avgGrade = Math.round(
    TEACHER_STUDENTS.reduce((s, st) => s + st.avgGrade, 0) / totalStudents
  );

  const groupOptions = TEACHER_GROUPS.map((g) => ({ value: g.id, label: g.name }));

  const handleViewProfile = (student: Student) => {
    setSelectedStudent(student);
    // Scroll to detail panel
    setTimeout(() => {
      document.getElementById('student-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Students"
        subtitle="Manage and monitor your students across all groups"
        actions={
          <>
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
            />
            <Select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              options={groupOptions}
              placeholder="All Groups"
              className="w-40"
            />
          </>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Students"
          value={totalStudents}
          icon={<Users className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label="Avg Attendance"
          value={`${avgAttendance}%`}
          icon={<ClipboardCheck className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Avg Grade"
          value={`${avgGrade}%`}
          icon={<BarChart2 className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">
            No students found.
          </div>
        ) : (
          filtered.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onViewProfile={handleViewProfile}
            />
          ))
        )}
      </div>

      {/* Detail Panel */}
      {selectedStudent && (
        <div id="student-detail">
          <StudentDetailPanel
            student={selectedStudent}
            onBack={() => setSelectedStudent(null)}
          />
        </div>
      )}
    </div>
  );
}
