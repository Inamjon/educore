"use client";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  BookOpen,
  Users2,
  TrendingUp,
  DollarSign,
  ClipboardCheck,
  UserPlus,
  ReceiptText,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  DASHBOARD_STATS,
  STUDENTS,
  TRANSACTIONS,
} from "@/lib/data";
import {
  RevenueChart,
  EnrollmentPieChart,
  AttendanceBarChart,
} from "@/components/charts/dashboard-charts";
import { useAuthStore } from "@/lib/store/auth-store";
import { useLessonsQuery } from "@/lib/queries/schedule";

const recentStudents = STUDENTS.slice(0, 5);
const recentTransactions = TRANSACTIONS.slice(0, 4);

function toLocalIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DashboardPage() {
  const t = useTranslations("AdminDashboard");
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const todayIso = toLocalIso(new Date());
  const { data: lessons = [] } = useLessonsQuery({
    organizationId: organizationId ?? "",
    date: todayIso,
  });
  const todayLessons = lessons.slice(0, 4);

  const QUICK_ACTIONS = [
    { label: t("quickActionNewStudent"), href: "/students", icon: UserPlus, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: t("quickActionNewTeacher"), href: "/teachers", icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
    { label: t("quickActionNewInvoice"), href: "/finance", icon: ReceiptText, color: "text-violet-600", bg: "bg-violet-50" },
    { label: t("quickActionTakeAttendance"), href: "/attendance", icon: ClipboardCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("statTotalStudents")}
          value={DASHBOARD_STATS.totalStudents}
          change={12}
          changeLabel={t("changeVsLastMonth")}
          icon={<Users className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          label={t("statTotalTeachers")}
          value={DASHBOARD_STATS.totalTeachers}
          change={5}
          changeLabel={t("changeVsLastMonth")}
          icon={<GraduationCap className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          label={t("statActiveCourses")}
          value={DASHBOARD_STATS.totalCourses}
          change={2}
          changeLabel={t("changeNewThisMonth")}
          icon={<BookOpen className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          label={t("statActiveGroups")}
          value={DASHBOARD_STATS.totalGroups}
          change={8}
          changeLabel={t("changeVsLastMonth")}
          icon={<Users2 className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
      </div>

      {/* Stat Cards Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("statMonthlyRevenue")}
          value={formatCurrency(DASHBOARD_STATS.monthlyRevenue)}
          change={14}
          changeLabel={t("changeVsLastMonth")}
          icon={<DollarSign className="h-5 w-5 text-violet-600" />}
          iconBg="bg-violet-50"
        />
        <StatCard
          label={t("statAvgAttendance")}
          value={`${DASHBOARD_STATS.avgAttendance}%`}
          change={-2}
          changeLabel={t("changeVsLastWeek")}
          icon={<ClipboardCheck className="h-5 w-5 text-pink-600" />}
          iconBg="bg-pink-50"
        />
        <StatCard
          label={t("statNewEnrollments")}
          value={DASHBOARD_STATS.newEnrollments}
          change={18}
          changeLabel={t("changeThisMonth")}
          icon={<UserPlus className="h-5 w-5 text-teal-600" />}
          iconBg="bg-teal-50"
        />
        <StatCard
          label={t("statPendingPayments")}
          value={DASHBOARD_STATS.pendingPayments}
          change={-25}
          changeLabel={t("changeVsLastMonth")}
          icon={<TrendingUp className="h-5 w-5 text-red-600" />}
          iconBg="bg-red-50"
        />
      </div>

      {/* Quick Actions */}
      <Card title={t("quickActionsTitle")} subtitle={t("quickActionsSubtitle")}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(({ label, href, icon: Icon, color, bg }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 p-4 text-center hover:border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <span className="text-sm font-medium text-slate-700">{label}</span>
            </Link>
          ))}
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" title={t("revenueExpensesTitle")} subtitle={t("revenueExpensesSubtitle")}>
          <RevenueChart />
        </Card>
        <Card title={t("enrollmentByCourseTitle")} subtitle={t("enrollmentByCourseSubtitle")}>
          <EnrollmentPieChart />
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Chart */}
        <Card title={t("weeklyAttendanceTitle")} subtitle={t("weeklyAttendanceSubtitle")}>
          <AttendanceBarChart />
        </Card>

        {/* Today's Lessons */}
        <Card title={t("todaysLessonsTitle")} subtitle={t("todaysLessonsSubtitle")}>
          <div className="space-y-3">
            {todayLessons.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">{t("noLessonsToday")}</p>
            )}
            {todayLessons.map((lesson) => (
              <div key={lesson.id} className="flex items-center gap-3">
                <div
                  className="h-9 w-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: lesson.course_color || "#6366f1" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{lesson.group_name}</p>
                  <p className="text-xs text-slate-400">{lesson.topic}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-slate-700">{lesson.start_time.slice(0, 5)}</p>
                  <p className="text-xs text-slate-400">{lesson.room}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Students */}
        <Card title={t("recentStudentsTitle")} subtitle={t("recentStudentsSubtitle")}>
          <div className="space-y-3">
            {recentStudents.map((student) => (
              <div key={student.id} className="flex items-center gap-3">
                <Avatar name={student.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{student.name}</p>
                  <p className="text-xs text-slate-400">{student.loginId}</p>
                </div>
                <StatusBadge status={student.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card title={t("recentTransactionsTitle")} subtitle={t("recentTransactionsSubtitle")}>
        <div className="space-y-3">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-4 py-1">
              <Avatar name={tx.studentName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{tx.studentName}</p>
                <p className="text-xs text-slate-400">{tx.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{formatCurrency(tx.amount)}</p>
                <p className="text-xs text-slate-400 capitalize">{tx.method}</p>
              </div>
              <StatusBadge status={tx.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
