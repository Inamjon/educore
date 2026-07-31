'use client';

import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  ClipboardCheck,
  FilePlus,
  BookOpenCheck,
  GraduationCap,
  Megaphone,
  BookOpen,
  Users,
  CalendarCheck,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TEACHER_STATS,
  TEACHER_SCHEDULE,
  TEACHER_EXAMS,
  WEEKLY_ATTENDANCE_DATA,
  GRADE_DISTRIBUTION_DATA,
} from '@/lib/teacher-data';
import { useTeacherNotificationsStore } from '@/lib/store/teacher-notifications-store';
import { useTeacherProfileStore } from '@/lib/store/teacher-profile-store';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = '2026-07-04';

const todayClasses = TEACHER_SCHEDULE.filter((s) => s.date === TODAY);
const upcomingLessons = TEACHER_SCHEDULE.filter((s) => s.date > TODAY).slice(0, 4);
const upcomingExams = TEACHER_EXAMS.filter((e) => e.status === 'upcoming');

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(dateStr: string) {
  const now = new Date(TODAY);
  const target = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `In ${diff} days`;
}

function formatRelativeTime(isoString: string) {
  const now = new Date('2026-07-04T14:43:49Z');
  const then = new Date(isoString);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

const notifDotColor: Record<string, string> = {
  message: 'bg-indigo-500',
  assignment: 'bg-amber-500',
  exam: 'bg-violet-500',
  class: 'bg-blue-500',
  admin: 'bg-slate-500',
};

// ─── Quick Action config ───────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    label: 'Take Attendance',
    icon: <ClipboardCheck className="h-6 w-6 text-indigo-600" />,
    iconBg: 'bg-indigo-50',
    href: '/teacher/attendance',
  },
  {
    label: 'Create Assignment',
    icon: <FilePlus className="h-6 w-6 text-blue-600" />,
    iconBg: 'bg-blue-50',
    href: '/teacher/assignments',
  },
  {
    label: 'Add Exam',
    icon: <BookOpenCheck className="h-6 w-6 text-amber-600" />,
    iconBg: 'bg-amber-50',
    href: '/teacher/exams',
  },
  {
    label: 'Grade Students',
    icon: <GraduationCap className="h-6 w-6 text-emerald-600" />,
    iconBg: 'bg-emerald-50',
    href: '/teacher/grades',
  },
  {
    label: 'Send Announcement',
    icon: <Megaphone className="h-6 w-6 text-violet-600" />,
    iconBg: 'bg-violet-50',
    href: '/teacher/messages',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScheduleItem({
  lesson,
}: {
  lesson: (typeof TEACHER_SCHEDULE)[number];
}) {
  return (
    <div
      className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0"
      style={{ borderLeft: `3px solid ${lesson.courseColor}`, paddingLeft: '12px' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-800 truncate">
            {lesson.groupName}
          </span>
          <StatusBadge status={lesson.status} />
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{lesson.topic}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {lesson.startTime} – {lesson.endTime} &middot; {lesson.room}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeacherDashboardPage() {
  const profile = useTeacherProfileStore((s) => s.profile);
  const notifications = useTeacherNotificationsStore((s) => s.items);

  const todayLabel = new Date('2026-07-04T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Good morning, {profile.name} 👋</h2>
            <p className="text-indigo-100 text-sm mt-1">{todayLabel}</p>
            <p className="text-white/90 mt-2 text-base font-medium">
              You have {TEACHER_STATS.todayClasses} class{TEACHER_STATS.todayClasses !== 1 ? 'es' : ''} today
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1 text-right">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-sm font-medium backdrop-blur-sm">
              Rating: ⭐ {profile.rating}
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-sm font-medium backdrop-blur-sm">
              {TEACHER_STATS.totalStudents} students
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Classes"
          value={TEACHER_STATS.todayClasses}
          icon={<CalendarCheck className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label="Total Students"
          value={TEACHER_STATS.totalStudents}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          label="Avg Attendance"
          value={`${TEACHER_STATS.avgAttendance}%`}
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Pending Grading"
          value={TEACHER_STATS.pendingGrading}
          icon={<AlertCircle className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
      </div>

      {/* ── Quick Actions ──────────────────────────────────────────────── */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-slate-100 hover:border-slate-200 hover:shadow-sm"
            >
              <div className={`p-3 rounded-xl ${action.iconBg}`}>{action.icon}</div>
              <span className="text-xs font-medium text-slate-700 text-center leading-tight">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </Card>

      {/* ── Today's Classes + Upcoming Lessons ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Classes — col-span-2 */}
        <div className="lg:col-span-2">
          <Card
            title="Today's Classes"
            subtitle={`${todayClasses.length} sessions on ${formatDate(TODAY)}`}
          >
            {todayClasses.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No classes today</p>
            ) : (
              <div className="space-y-0">
                {todayClasses.map((lesson) => (
                  <ScheduleItem key={lesson.id} lesson={lesson} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Upcoming Lessons */}
        <Card title="Upcoming Lessons" subtitle="Next 4 sessions">
          {upcomingLessons.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No upcoming lessons</p>
          ) : (
            <div className="space-y-0">
              {upcomingLessons.map((lesson) => (
                <ScheduleItem key={lesson.id} lesson={lesson} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Bar Chart */}
        <Card title="Student Attendance Summary" subtitle="This week">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={WEEKLY_ATTENDANCE_DATA}
              margin={{ top: 4, right: 0, bottom: 0, left: -20 }}
              barSize={16}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="present" fill="#6366f1" radius={[4, 4, 0, 0]} name="Present" />
              <Bar dataKey="absent" fill="#fca5a5" radius={[4, 4, 0, 0]} name="Absent" />
              <Bar dataKey="late" fill="#fcd34d" radius={[4, 4, 0, 0]} name="Late" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 inline-block" /> Present
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-red-300 inline-block" /> Absent
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-300 inline-block" /> Late
            </span>
          </div>
        </Card>

        {/* Grade Distribution Pie Chart */}
        <Card title="Grade Distribution" subtitle="All groups">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={GRADE_DISTRIBUTION_DATA}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {GRADE_DISTRIBUTION_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
                formatter={(value: unknown) => [`${value} students`, undefined]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Recent Activity + Exam Reminders ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity — col-span-2 */}
        <div className="lg:col-span-2">
          <Card title="Recent Activity" subtitle="Latest notifications">
            <div className="space-y-4">
              {notifications.slice(0, 5).map((notif) => (
                <div key={notif.id} className="flex items-start gap-3">
                  <div className="mt-1.5 flex-shrink-0">
                    <span
                      className={`h-2.5 w-2.5 rounded-full inline-block ${notifDotColor[notif.category] ?? 'bg-slate-400'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {notif.title}
                      </p>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Exam Reminders */}
        <Card title="Exam Reminders" subtitle={`${upcomingExams.length} upcoming`}>
          <div className="space-y-3">
            {upcomingExams.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No upcoming exams</p>
            ) : (
              upcomingExams.map((exam) => (
                <div
                  key={exam.id}
                  className="rounded-xl border border-slate-100 p-3 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {exam.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {exam.groupName}
                      </p>
                    </div>
                    <BookOpen className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">
                      {formatDate(exam.date)} &middot; {exam.startTime}
                    </span>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                      {daysUntil(exam.date)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
