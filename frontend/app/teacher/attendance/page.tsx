'use client';

import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileQuestion,
  Save,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { TEACHER_ATTENDANCE, TEACHER_GROUPS } from '@/lib/teacher-data';

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface StudentRow {
  id: string;
  name: string;
  avatar?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: {
  value: AttendanceStatus;
  label: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
  inactiveBg: string;
  inactiveText: string;
}[] = [
  {
    value: 'present',
    label: 'Present',
    activeBg: 'bg-emerald-500',
    activeText: 'text-white',
    activeBorder: 'border-emerald-500',
    inactiveBg: 'bg-white',
    inactiveText: 'text-emerald-600',
  },
  {
    value: 'absent',
    label: 'Absent',
    activeBg: 'bg-red-500',
    activeText: 'text-white',
    activeBorder: 'border-red-500',
    inactiveBg: 'bg-white',
    inactiveText: 'text-red-600',
  },
  {
    value: 'late',
    label: 'Late',
    activeBg: 'bg-amber-500',
    activeText: 'text-white',
    activeBorder: 'border-amber-500',
    inactiveBg: 'bg-white',
    inactiveText: 'text-amber-600',
  },
  {
    value: 'excused',
    label: 'Excused',
    activeBg: 'bg-blue-500',
    activeText: 'text-white',
    activeBorder: 'border-blue-500',
    inactiveBg: 'bg-white',
    inactiveText: 'text-blue-600',
  },
];

const GROUP_OPTIONS = TEACHER_GROUPS.map((g) => ({
  value: g.id,
  label: g.name,
}));

const WEEK_DAYS: { date: string; label: string }[] = (() => {
  const today = new Date('2026-07-04');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + 1 + i); // Mon‑Sun
    const iso = d.toISOString().split('T')[0];
    return {
      date: iso,
      label: `${days[d.getDay()]} ${d.getDate()}`,
    };
  });
})();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getDayQuality(date: string): 'great' | 'ok' | 'poor' | 'none' {
  const records = TEACHER_ATTENDANCE.filter((r) => r.date === date);
  if (records.length === 0) return 'none';
  const present = records.filter((r) => r.status === 'present').length;
  const rate = present / records.length;
  if (rate >= 0.9) return 'great';
  if (rate >= 0.7) return 'ok';
  return 'poor';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeacherAttendancePage() {
  const today = '2026-07-04';

  // Header filters
  const [headerGroupId, setHeaderGroupId] = useState(TEACHER_GROUPS[0].id);
  const [headerDate, setHeaderDate] = useState(today);

  // Take-attendance panel
  const [activeGroupId, setActiveGroupId] = useState(TEACHER_GROUPS[0].id);
  const [saved, setSaved] = useState(false);

  const activeGroup = TEACHER_GROUPS.find((g) => g.id === activeGroupId) ?? TEACHER_GROUPS[0];
  const students: StudentRow[] = activeGroup.students.map((s) => ({
    id: s.id,
    name: s.name,
    avatar: s.avatar,
  }));

  // Per-student attendance state: default to 'present'
  const [attendanceState, setAttendanceState] = useState<
    Record<string, { status: AttendanceStatus; note: string }>
  >(() =>
    Object.fromEntries(
      TEACHER_GROUPS.flatMap((g) =>
        g.students.map((s) => [s.id, { status: 'present' as AttendanceStatus, note: '' }])
      )
    )
  );

  function setStatus(studentId: string, status: AttendanceStatus) {
    setSaved(false);
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  }

  function setNote(studentId: string, note: string) {
    setSaved(false);
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], note },
    }));
  }

  function handleSave() {
    setSaved(true);
  }

  // Summary for the active group
  const groupSummary = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0 };
    students.forEach((s) => {
      const st = attendanceState[s.id]?.status ?? 'present';
      counts[st]++;
    });
    return counts;
  }, [students, attendanceState]);

  // Global stats from TEACHER_ATTENDANCE
  const globalStats = useMemo(() => ({
    present: TEACHER_ATTENDANCE.filter((r) => r.status === 'present').length,
    absent: TEACHER_ATTENDANCE.filter((r) => r.status === 'absent').length,
    late: TEACHER_ATTENDANCE.filter((r) => r.status === 'late').length,
    excused: TEACHER_ATTENDANCE.filter((r) => r.status === 'excused').length,
  }), []);

  // Right panel: per-student attendance rate for active group's students
  const studentRates = useMemo(() => {
    return activeGroup.students
      .map((s) => ({ id: s.id, name: s.name, rate: s.attendanceRate }))
      .sort((a, b) => a.rate - b.rate);
  }, [activeGroup]);

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <PageHeader
        title="Attendance"
        subtitle="Track and manage student attendance across your groups"
        actions={
          <div className="flex items-center gap-2">
            <Select
              options={GROUP_OPTIONS}
              value={headerGroupId}
              onChange={(e) => setHeaderGroupId(e.target.value)}
              className="w-40"
            />
            <input
              type="date"
              value={headerDate}
              onChange={(e) => setHeaderDate(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        }
      />

      {/* ── Stats Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Present"
          value={globalStats.present}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Absent"
          value={globalStats.absent}
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          iconBg="bg-red-50"
        />
        <StatCard
          label="Late"
          value={globalStats.late}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
        <StatCard
          label="Excused"
          value={globalStats.excused}
          icon={<FileQuestion className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50"
        />
      </div>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Take Attendance ───────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-0">
          <Card
            noPadding
            title="Take Attendance"
            actions={
              <div className="flex items-center gap-2">
                <Select
                  options={GROUP_OPTIONS}
                  value={activeGroupId}
                  onChange={(e) => {
                    setActiveGroupId(e.target.value);
                    setSaved(false);
                  }}
                  className="w-36"
                />
                <span className="text-sm text-slate-400 hidden sm:block">
                  {formatDate(today)}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  className="gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  {saved ? 'Saved!' : 'Save'}
                </Button>
              </div>
            }
          >
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">
                      Student
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-4">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const currentStatus =
                      attendanceState[student.id]?.status ?? 'present';
                    const currentNote =
                      attendanceState[student.id]?.note ?? '';

                    return (
                      <tr
                        key={student.id}
                        className="border-b border-slate-50 last:border-0"
                      >
                        {/* Student column */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={student.name} size="sm" />
                            <span className="text-sm font-medium text-slate-900">
                              {student.name}
                            </span>
                          </div>
                        </td>

                        {/* Status pill buttons */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {STATUS_CONFIG.map((cfg) => {
                              const isActive = currentStatus === cfg.value;
                              return (
                                <button
                                  key={cfg.value}
                                  type="button"
                                  onClick={() => setStatus(student.id, cfg.value)}
                                  className={`
                                    inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-all
                                    ${
                                      isActive
                                        ? `${cfg.activeBg} ${cfg.activeText} ${cfg.activeBorder}`
                                        : `${cfg.inactiveBg} ${cfg.inactiveText} border-slate-200 hover:border-current`
                                    }
                                  `}
                                >
                                  {cfg.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        {/* Note input */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={currentNote}
                            onChange={(e) => setNote(student.id, e.target.value)}
                            placeholder="Add note…"
                            className="h-8 w-full max-w-[200px] rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-all"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary row */}
            <div className="flex items-center gap-6 px-4 py-3 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex-wrap">
              <span className="text-xs font-medium text-slate-500">Summary:</span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Present: {groupSummary.present}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                Absent: {groupSummary.absent}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Late: {groupSummary.late}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                Excused: {groupSummary.excused}
              </span>
              <span className="ml-auto text-xs text-slate-400">
                {students.length} students total
              </span>
            </div>
          </Card>
        </div>

        {/* ── Right column ───────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Attendance stats — progress bars per student */}
          <Card title="Attendance Rates" subtitle={`${activeGroup.name} students`}>
            <div className="space-y-4">
              {studentRates.map((s) => (
                <div key={s.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700 truncate">
                      {s.name}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        s.rate < 70
                          ? 'text-red-500'
                          : s.rate < 80
                          ? 'text-amber-500'
                          : 'text-emerald-600'
                      }`}
                    >
                      {s.rate}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        s.rate < 70
                          ? 'bg-red-400'
                          : s.rate < 80
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${s.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-50 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span>80–100% — Good</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span>70–79% — Warning</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span>Below 70% — Critical</span>
              </div>
            </div>
          </Card>

          {/* Weekly calendar card */}
          <Card title="This Week" subtitle="Mon–Sun, Jul 2026">
            <div className="space-y-2">
              {WEEK_DAYS.map(({ date, label }) => {
                const quality = getDayQuality(date);
                const isToday = date === today;
                const records = TEACHER_ATTENDANCE.filter((r) => r.date === date);
                const hasClass = records.length > 0;

                const dotColor =
                  quality === 'great'
                    ? 'bg-emerald-400'
                    : quality === 'ok'
                    ? 'bg-amber-400'
                    : quality === 'poor'
                    ? 'bg-red-400'
                    : 'bg-slate-200';

                return (
                  <div
                    key={date}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                      isToday
                        ? 'bg-indigo-50 border border-indigo-100'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Day label */}
                    <span
                      className={`text-xs font-semibold w-12 ${
                        isToday ? 'text-indigo-700' : 'text-slate-500'
                      }`}
                    >
                      {label}
                    </span>

                    {/* Dot */}
                    <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${dotColor}`} />

                    {/* Detail */}
                    <span className="text-xs text-slate-500 flex-1">
                      {hasClass
                        ? `${records.length} record${records.length !== 1 ? 's' : ''}`
                        : 'No class'}
                    </span>

                    {/* Quality label */}
                    {hasClass && (
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          quality === 'great'
                            ? 'bg-emerald-50 text-emerald-600'
                            : quality === 'ok'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-red-50 text-red-500'
                        }`}
                      >
                        {quality === 'great' ? '100%' : quality === 'ok' ? '~80%' : '~60%'}
                      </span>
                    )}

                    {isToday && (
                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-slate-50 flex flex-wrap gap-3">
              {[
                { color: 'bg-emerald-400', label: 'Great (≥90%)' },
                { color: 'bg-amber-400', label: 'OK (70–89%)' },
                { color: 'bg-red-400', label: 'Poor (<70%)' },
                { color: 'bg-slate-200', label: 'No class' },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className={`h-2 w-2 rounded-full ${color}`} />
                  {label}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
