"use client";
import { useState } from "react";
import { CheckCircle2, XCircle, Clock, FileQuestion, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { SearchInput, Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { useAuthStore } from "@/lib/store/auth-store";
import { useAttendanceQuery } from "@/lib/queries/attendance";
import { useGroupsQuery } from "@/lib/queries/groups";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/api/attendance";
import { ApiError } from "@/lib/api/client";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
  { value: "early_leave", label: "Early Leave" },
  { value: "sick", label: "Sick" },
];

const COLUMNS: Column<AttendanceRecord>[] = [
  {
    key: "student_name",
    label: "Student",
    render: (_, row) => (
      <div className="flex items-center gap-3">
        <Avatar name={row.student_name} size="sm" />
        <span className="font-medium text-slate-900">{row.student_name}</span>
      </div>
    ),
  },
  { key: "group_name", label: "Group" },
  {
    key: "date",
    label: "Date",
    render: (val) => new Date(String(val)).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
  },
  {
    key: "status",
    label: "Status",
    render: (val) => <StatusBadge status={String(val)} />,
  },
  {
    key: "notes",
    label: "Note",
    render: (val) => (val ? <span className="text-sm text-slate-500">{String(val)}</span> : <span className="text-slate-300">—</span>),
  },
];

export default function AttendancePage() {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "">("");
  const [groupFilter, setGroupFilter] = useState("");

  const { data: groups } = useGroupsQuery({ organizationId: organizationId ?? "" });
  const {
    data: records,
    isLoading,
    isError,
    error,
  } = useAttendanceQuery({
    organizationId: organizationId ?? "",
    status: statusFilter || undefined,
    group: groupFilter || undefined,
  });

  const list = records ?? [];
  const filtered = list.filter(
    (r) => !search || r.student_name.toLowerCase().includes(search.toLowerCase())
  );

  const GROUP_OPTIONS = [
    { value: "", label: "All Groups" },
    ...(groups ?? []).map((g) => ({ value: g.id, label: g.name })),
  ];

  const stats = {
    present: list.filter((r) => r.status === "present").length,
    absent: list.filter((r) => r.status === "absent").length,
    late: list.filter((r) => r.status === "late").length,
    excused: list.filter((r) => r.status === "excused").length,
  };

  const total = list.length;
  const attendanceRate = total > 0 ? Math.round((stats.present / total) * 100) : 0;

  // Per-student attendance rate, derived from actual records rather than a
  // stored field — same pattern as Course's group_count/student_count.
  const studentRates = Object.values(
    list.reduce<Record<string, { id: string; name: string; total: number; present: number }>>((acc, r) => {
      const entry = acc[r.student_profile] ?? { id: r.student_profile, name: r.student_name, total: 0, present: 0 };
      entry.total += 1;
      if (r.status === "present") entry.present += 1;
      acc[r.student_profile] = entry;
      return acc;
    }, {})
  )
    .map((s) => ({ id: s.id, name: s.name, rate: Math.round((s.present / s.total) * 100) }))
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle={`${attendanceRate}% overall attendance rate`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Present" value={stats.present} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Absent" value={stats.absent} icon={<XCircle className="h-5 w-5 text-red-500" />} iconBg="bg-red-50" />
        <StatCard label="Late" value={stats.late} icon={<Clock className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
        <StatCard label="Excused" value={stats.excused} icon={<FileQuestion className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card
          className="lg:col-span-2"
          noPadding
          title="Attendance Records"
          subtitle={`${filtered.length} records`}
          actions={
            <div className="flex items-center gap-2">
              <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student..." />
              <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AttendanceStatus | "")} className="w-32" />
              <Select options={GROUP_OPTIONS} value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="w-36" />
            </div>
          }
        >
          {isError ? (
            <div className="flex items-center gap-2 px-6 py-8 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" />
              {error instanceof ApiError ? error.message : "Failed to load attendance."}
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading attendance…
            </div>
          ) : (
            <DataTable columns={COLUMNS} data={filtered} keyField="id" emptyMessage="No records found" />
          )}
        </Card>

        <Card title="Low Attendance Alert" subtitle="Students below 80%">
          <div className="space-y-4">
            {studentRates.length === 0 && <p className="text-sm text-slate-400">No attendance records yet.</p>}
            {studentRates.map((s) => (
              <div key={s.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700 truncate">{s.name}</span>
                  <span className={`text-sm font-bold ${s.rate < 70 ? "text-red-500" : s.rate < 80 ? "text-amber-500" : "text-emerald-600"}`}>
                    {s.rate}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${s.rate < 70 ? "bg-red-400" : s.rate < 80 ? "bg-amber-400" : "bg-emerald-400"}`}
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
      </div>
    </div>
  );
}
