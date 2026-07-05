"use client";
import { useState } from "react";
import { CheckCircle2, XCircle, Clock, FileQuestion } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { SearchInput, Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { ATTENDANCE_RECORDS, STUDENTS } from "@/lib/data";
import type { AttendanceRecord } from "@/types";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
];

const GROUP_OPTIONS = [
  { value: "", label: "All Groups" },
  ...Array.from(new Set(ATTENDANCE_RECORDS.map((r) => r.groupName))).map((g) => ({ value: g, label: g })),
];

const COLUMNS: Column<AttendanceRecord>[] = [
  {
    key: "studentName",
    label: "Student",
    render: (_, row) => (
      <div className="flex items-center gap-3">
        <Avatar name={row.studentName} size="sm" />
        <span className="font-medium text-slate-900">{row.studentName}</span>
      </div>
    ),
  },
  { key: "groupName", label: "Group" },
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
    key: "note",
    label: "Note",
    render: (val) => val ? <span className="text-sm text-slate-500">{String(val)}</span> : <span className="text-slate-300">—</span>,
  },
];

export default function AttendancePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");

  const filtered = ATTENDANCE_RECORDS.filter((r) => {
    const matchesSearch = !search || r.studentName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || r.status === statusFilter;
    const matchesGroup = !groupFilter || r.groupName === groupFilter;
    return matchesSearch && matchesStatus && matchesGroup;
  });

  const stats = {
    present: ATTENDANCE_RECORDS.filter((r) => r.status === "present").length,
    absent: ATTENDANCE_RECORDS.filter((r) => r.status === "absent").length,
    late: ATTENDANCE_RECORDS.filter((r) => r.status === "late").length,
    excused: ATTENDANCE_RECORDS.filter((r) => r.status === "excused").length,
  };

  const total = ATTENDANCE_RECORDS.length;
  const attendanceRate = Math.round((stats.present / total) * 100);

  // Per-student attendance rate
  const studentRates = STUDENTS.map((s) => ({
    id: s.id,
    name: s.name,
    rate: s.attendanceRate,
  })).sort((a, b) => a.rate - b.rate).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        subtitle={`${attendanceRate}% overall attendance rate`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Present" value={stats.present} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Absent" value={stats.absent} icon={<XCircle className="h-5 w-5 text-red-500" />} iconBg="bg-red-50" />
        <StatCard label="Late" value={stats.late} icon={<Clock className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
        <StatCard label="Excused" value={stats.excused} icon={<FileQuestion className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Table */}
        <Card
          className="lg:col-span-2"
          noPadding
          title="Attendance Records"
          subtitle={`${filtered.length} records`}
          actions={
            <div className="flex items-center gap-2">
              <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student..." />
              <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-32" />
              <Select options={GROUP_OPTIONS} value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="w-36" />
            </div>
          }
        >
          <DataTable columns={COLUMNS} data={filtered} keyField="id" emptyMessage="No records found" />
        </Card>

        {/* Low Attendance Alert */}
        <Card title="Low Attendance Alert" subtitle="Students below 80%">
          <div className="space-y-4">
            {studentRates.map((s) => (
              <div key={s.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700 truncate">{s.name}</span>
                  <span
                    className={`text-sm font-bold ${s.rate < 70 ? "text-red-500" : s.rate < 80 ? "text-amber-500" : "text-emerald-600"}`}
                  >
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
