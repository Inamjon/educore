"use client";
import { useState } from "react";
import { AlertCircle, CheckCircle2, ClipboardList, Clock, Loader2, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { SearchInput, Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth-store";
import { useGroupsQuery } from "@/lib/queries/groups";
import { useAssignmentsQuery, useSubmissionsQuery } from "@/lib/queries/homework";
import type { Assignment, AssignmentStatus } from "@/lib/api/homework";
import { ApiError } from "@/lib/api/client";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const COLUMNS: Column<Assignment>[] = [
  {
    key: "title",
    label: "Assignment",
    render: (_, row) => (
      <div>
        <p className="font-medium text-slate-900">{row.title}</p>
        <p className="text-xs text-slate-400">{row.group_name}</p>
      </div>
    ),
  },
  { key: "due_date", label: "Due", render: (val) => formatDate(String(val)) },
  { key: "status", label: "Status", render: (val) => <StatusBadge status={String(val)} /> },
  {
    key: "submitted_count",
    label: "Submitted",
    render: (_, row) => (
      <span className="text-sm text-slate-600">
        {row.submitted_count}/{row.total_students}
      </span>
    ),
  },
  {
    key: "graded_count",
    label: "Graded",
    render: (val) => <span className="text-sm text-slate-600">{String(val)}</span>,
  },
];

function SubmissionsDetail({ assignment, onClose }: { assignment: Assignment; onClose: () => void }) {
  const organizationId = useAuthStore((s) => s.user?.organizationId) ?? "";
  const { data: submissions = [], isLoading } = useSubmissionsQuery({ organizationId, assignment: assignment.id });

  return (
    <Card
      title={assignment.title}
      subtitle={`${assignment.group_name} · Due ${formatDate(assignment.due_date)}`}
      actions={
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading submissions…
        </div>
      ) : submissions.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">No submissions yet.</p>
      ) : (
        <div className="divide-y divide-slate-50">
          {submissions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 py-3">
              <Avatar name={s.student_name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{s.student_name}</p>
                <p className="text-xs text-slate-400">
                  Submitted {new Date(s.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {s.is_late && <span className="text-red-500 font-medium"> · Late</span>}
                </p>
              </div>
              {s.score !== null ? (
                <span className="text-sm font-semibold text-emerald-700">
                  {s.score}/{assignment.max_score}
                </span>
              ) : (
                <span className="text-xs text-slate-400">Awaiting grading</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function HomeworkPage() {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | "">("");
  const [groupFilter, setGroupFilter] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const { data: groups } = useGroupsQuery({ organizationId: organizationId ?? "" });
  const {
    data: assignments,
    isLoading,
    isError,
    error,
  } = useAssignmentsQuery({
    organizationId: organizationId ?? "",
    status: statusFilter || undefined,
    group: groupFilter || undefined,
  });

  const list = assignments ?? [];
  const filtered = list.filter(
    (a) => !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.group_name.toLowerCase().includes(search.toLowerCase())
  );

  const GROUP_OPTIONS = [{ value: "", label: "All Groups" }, ...(groups ?? []).map((g) => ({ value: g.id, label: g.name }))];

  const totalStudentSlots = list.reduce((sum, a) => sum + a.total_students, 0);
  const totalSubmitted = list.reduce((sum, a) => sum + a.submitted_count, 0);
  const totalGraded = list.reduce((sum, a) => sum + a.graded_count, 0);
  const completionRate = totalStudentSlots > 0 ? Math.round((totalSubmitted / totalStudentSlots) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Homework" subtitle={`${list.length} assignments across all groups`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Assignments" value={list.length} icon={<ClipboardList className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Submitted" value={totalSubmitted} icon={<CheckCircle2 className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard label="Graded" value={totalGraded} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Completion Rate" value={`${completionRate}%`} icon={<Clock className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
      </div>

      <Card
        noPadding
        title="All Assignments"
        subtitle={`${filtered.length} assignments`}
        actions={
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assignments..." />
            <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AssignmentStatus | "")} className="w-32" />
            <Select options={GROUP_OPTIONS} value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="w-40" />
          </div>
        }
      >
        {isError ? (
          <div className="flex items-center gap-2 px-6 py-8 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error instanceof ApiError ? error.message : "Failed to load assignments."}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading assignments…
          </div>
        ) : (
          <DataTable columns={COLUMNS} data={filtered} keyField="id" onRowClick={setSelectedAssignment} emptyMessage="No assignments found" />
        )}
      </Card>

      {selectedAssignment && (
        <SubmissionsDetail assignment={selectedAssignment} onClose={() => setSelectedAssignment(null)} />
      )}
    </div>
  );
}
