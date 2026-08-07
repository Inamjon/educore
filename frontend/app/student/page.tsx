"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CalendarCheck,
  GraduationCap,
  ClipboardList,
  BookOpenCheck,
  FileText,
  BarChart2,
  ClipboardCheck,
  MessageSquare,
  Clock,
  MapPin,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import {
  STUDENT_PROFILE,
  STUDENT_STATS,
  STUDENT_EXAMS,
  GRADE_TREND_DATA,
} from "@/lib/student-data";
import { useNotificationsQuery } from "@/lib/queries/notifications";
import { useAuthStore } from "@/lib/store/auth-store";
import { useLessonsQuery } from "@/lib/queries/schedule";
import type { Lesson } from "@/lib/api/schedule";
import { useStudentsQuery } from "@/lib/queries/students";
import { useStudentGroupMembershipsQuery } from "@/lib/queries/groups";
import { useAssignmentsQuery, useSubmissionsQuery } from "@/lib/queries/homework";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = "2026-07-04";

function toLocalIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const upcomingExams = STUDENT_EXAMS.filter((e) => e.status === "upcoming");

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(dateStr: string) {
  const now = new Date(TODAY);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

function formatRelativeTime(isoString: string) {
  // Real wall-clock "now" — this now also formats real Notification
  // timestamps (see the Recent Activity card below), which aren't anchored
  // to the dashboard's fixed demo date the way STUDENT_* mock data still is.
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

const HOMEWORK_STATUS_CONFIG: Record<string, { label: string; variant: "success" | "info" | "warning" | "danger" }> = {
  pending: { label: "Pending", variant: "warning" },
  submitted: { label: "Submitted", variant: "info" },
  graded: { label: "Graded", variant: "success" },
  late: { label: "Late", variant: "danger" },
};

const notifDotColor: Record<string, string> = {
  message: "bg-indigo-500",
  homework: "bg-amber-500",
  exam: "bg-violet-500",
  class: "bg-blue-500",
  admin: "bg-slate-500",
};

// ─── Quick Action config ───────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    label: "View Homework",
    icon: <FileText className="h-6 w-6 text-indigo-600" />,
    iconBg: "bg-indigo-50",
    href: "/student/homework",
  },
  {
    label: "Check Grades",
    icon: <BarChart2 className="h-6 w-6 text-emerald-600" />,
    iconBg: "bg-emerald-50",
    href: "/student/grades",
  },
  {
    label: "View Schedule",
    icon: <CalendarCheck className="h-6 w-6 text-blue-600" />,
    iconBg: "bg-blue-50",
    href: "/student/schedule",
  },
  {
    label: "My Attendance",
    icon: <ClipboardCheck className="h-6 w-6 text-amber-600" />,
    iconBg: "bg-amber-50",
    href: "/student/attendance",
  },
  {
    label: "Messages",
    icon: <MessageSquare className="h-6 w-6 text-violet-600" />,
    iconBg: "bg-violet-50",
    href: "/student/messages",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScheduleItem({ lesson }: { lesson: Lesson }) {
  return (
    <div
      className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0"
      style={{ borderLeft: `3px solid ${lesson.course_color || "#6366f1"}`, paddingLeft: "12px" }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-800 truncate">
            {lesson.group_name}
          </span>
          <StatusBadge status={lesson.status} />
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{lesson.topic}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {lesson.start_time.slice(0, 5)} – {lesson.end_time.slice(0, 5)} &middot; {lesson.room || "—"}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentDashboardPage() {
  const { data: notifications = [] } = useNotificationsQuery();
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const todayIso = toLocalIso(new Date());
  const { data: lessons = [] } = useLessonsQuery({ organizationId: organizationId ?? "", dateFrom: todayIso });
  const todayClasses = lessons.filter((l) => l.date === todayIso);
  const upcomingLessons = lessons.filter((l) => l.date > todayIso).slice(0, 4);

  const authUserId = useAuthStore((s) => s.user?.id);
  const { data: students = [] } = useStudentsQuery({ organizationId: organizationId ?? "" });
  const myProfile = students.find((s) => s.user === authUserId);
  const { data: memberships = [] } = useStudentGroupMembershipsQuery(myProfile?.id ?? null);
  const myGroupIds = new Set(memberships.filter((m) => m.status === "active").map((m) => m.group));
  const { data: assignments = [] } = useAssignmentsQuery({ organizationId: organizationId ?? "" });
  const myAssignments = assignments.filter((a) => myGroupIds.has(a.group));
  const { data: submissions = [] } = useSubmissionsQuery({ organizationId: organizationId ?? "", studentProfile: myProfile?.id });
  const submittedAssignmentIds = new Set(submissions.map((s) => s.assignment));
  const allPendingHomework = myAssignments.filter((a) => !submittedAssignmentIds.has(a.id));
  const pendingHomework = allPendingHomework.slice(0, 4);

  const todayLabel = new Date(TODAY + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, {STUDENT_PROFILE.name.split(" ")[0]} 👋</h2>
            <p className="text-indigo-100 text-sm mt-1">{todayLabel}</p>
            <p className="text-white/90 mt-2 text-base font-medium">
              You have {todayClasses.length} class{todayClasses.length !== 1 ? "es" : ""} today
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1 text-right">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-sm font-medium backdrop-blur-sm">
              Avg Grade: {STUDENT_STATS.avgGrade}%
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-sm font-medium backdrop-blur-sm">
              {STUDENT_STATS.enrolledCourses} courses enrolled
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Attendance Rate"
          value={`${STUDENT_STATS.attendanceRate}%`}
          icon={<ClipboardCheck className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label="Average Grade"
          value={`${STUDENT_STATS.avgGrade}%`}
          icon={<GraduationCap className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Pending Homework"
          value={allPendingHomework.length}
          icon={<ClipboardList className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
        <StatCard
          label="Upcoming Exams"
          value={STUDENT_STATS.upcomingExams}
          icon={<BookOpenCheck className="h-5 w-5 text-violet-600" />}
          iconBg="bg-violet-50"
        />
      </div>

      {/* ── Quick Actions ──────────────────────────────────────────────── */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-slate-100 hover:border-slate-200 hover:shadow-sm"
            >
              <div className={`p-3 rounded-xl ${action.iconBg}`}>{action.icon}</div>
              <span className="text-xs font-medium text-slate-700 text-center leading-tight">
                {action.label}
              </span>
            </a>
          ))}
        </div>
      </Card>

      {/* ── Today's Classes + Upcoming Lessons ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card
            title="Today's Classes"
            subtitle={`${todayClasses.length} sessions on ${formatDate(todayIso)}`}
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

      {/* ── Charts + Pending Homework ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Trend */}
        <Card title="Grade Trend" subtitle="Average score over recent months">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={GRADE_TREND_DATA} margin={{ top: 4, right: 12, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: "#6366f1" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Pending Homework */}
        <Card title="Pending Homework" subtitle={`${pendingHomework.length} items need attention`}>
          {pendingHomework.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">You&apos;re all caught up!</p>
          ) : (
            <div className="space-y-3">
              {pendingHomework.map((assignment) => {
                const isLate = assignment.due_date < todayIso;
                return (
                  <div
                    key={assignment.id}
                    className="rounded-xl border border-slate-100 p-3 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{assignment.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{assignment.group_name}</p>
                      </div>
                      <Badge
                        label={HOMEWORK_STATUS_CONFIG[isLate ? "late" : "pending"].label}
                        variant={HOMEWORK_STATUS_CONFIG[isLate ? "late" : "pending"].variant}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      Due {formatDate(assignment.due_date)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Recent Activity + Exam Reminders ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Recent Activity" subtitle="Latest notifications">
            <div className="space-y-4">
              {notifications.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">No recent notifications</p>
              )}
              {notifications.slice(0, 5).map((notif) => (
                <div key={notif.id} className="flex items-start gap-3">
                  <div className="mt-1.5 flex-shrink-0">
                    <span
                      className={`h-2.5 w-2.5 rounded-full inline-block ${notifDotColor[notif.category] ?? "bg-slate-400"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{notif.title}</p>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

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
                      <p className="text-sm font-semibold text-slate-800 truncate">{exam.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{exam.groupName}</p>
                    </div>
                    <BookOpenCheck className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
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
