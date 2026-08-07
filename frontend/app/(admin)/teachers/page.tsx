"use client";
import { useState } from "react";
import { UserPlus, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/lib/store/toast-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { useDeleteTeacherMutation, useTeachersQuery } from "@/lib/queries/teachers";
import type { TeacherProfile, TeacherStatus } from "@/lib/api/teachers";
import { ApiError } from "@/lib/api/client";
import { GraduationCap, UserCheck, UserX, Clock } from "lucide-react";
import { TeacherFormDialog } from "./_components/teacher-form-dialog";
import { TeacherDetailPanel } from "./_components/teacher-detail-panel";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
];

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  freelance: "Freelance",
  intern: "Intern",
};

export default function TeachersPage() {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TeacherStatus | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<TeacherProfile | null>(null);

  const {
    data: teachers,
    isLoading,
    isError,
    error,
  } = useTeachersQuery({
    organizationId: organizationId ?? "",
    status: statusFilter || undefined,
    search: search || undefined,
  });
  const deleteMutation = useDeleteTeacherMutation();

  const list = teachers ?? [];
  const selectedTeacher = list.find((t) => t.id === selectedId) ?? null;

  const stats = {
    total: list.length,
    active: list.filter((t) => t.status === "active").length,
    inactive: list.filter((t) => t.status === "inactive" || t.status === "on_leave" || t.status === "terminated").length,
    pending: list.filter((t) => t.status === "pending").length,
  };

  const COLUMNS: Column<TeacherProfile>[] = [
    {
      key: "user_full_name",
      label: "Teacher",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.user_full_name} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{row.user_full_name}</p>
            <p className="text-xs text-slate-400">{row.user_login_id}</p>
          </div>
        </div>
      ),
    },
    { key: "user_phone", label: "Phone" },
    { key: "teacher_code", label: "Teacher Code" },
    {
      key: "employment_type",
      label: "Employment",
      render: (val) => EMPLOYMENT_LABELS[String(val)] ?? String(val),
    },
    {
      key: "status",
      label: "Status",
      render: (val) => <StatusBadge status={String(val)} />,
    },
    {
      key: "hire_date",
      label: "Hired",
      render: (val) => new Date(String(val)).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    },
    {
      key: "id",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingTeacher(row);
              setFormOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeletingTeacher(row)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        subtitle={`${stats.total} teachers on staff`}
        actions={
          <Button
            onClick={() => {
              setEditingTeacher(null);
              setFormOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            Add Teacher
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Teachers" value={stats.total} icon={<GraduationCap className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Active" value={stats.active} icon={<UserCheck className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Inactive" value={stats.inactive} icon={<UserX className="h-5 w-5 text-red-500" />} iconBg="bg-red-50" />
        <StatCard label="Pending" value={stats.pending} icon={<Clock className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
      </div>

      <Card
        noPadding
        title="All Teachers"
        subtitle={`Showing ${list.length} teachers`}
        actions={
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teachers..." />
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TeacherStatus | "")}
              className="w-36"
            />
          </div>
        }
      >
        {isError ? (
          <div className="flex items-center gap-2 px-6 py-8 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error instanceof ApiError ? error.message : "Failed to load teachers."}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading teachers…
          </div>
        ) : (
          <DataTable
            columns={COLUMNS}
            data={list}
            keyField="id"
            emptyMessage="No teachers found"
            onRowClick={(row) => setSelectedId(row.id)}
          />
        )}
      </Card>

      {selectedTeacher && (
        <TeacherDetailPanel
          teacher={selectedTeacher}
          onBack={() => setSelectedId(null)}
          onEdit={() => {
            setEditingTeacher(selectedTeacher);
            setFormOpen(true);
          }}
          onDelete={() => setDeletingTeacher(selectedTeacher)}
        />
      )}

      <TeacherFormDialog open={formOpen} onOpenChange={setFormOpen} teacher={editingTeacher} />

      <ConfirmDialog
        open={!!deletingTeacher}
        onOpenChange={(open) => !open && setDeletingTeacher(null)}
        title="Delete teacher"
        description={`Are you sure you want to remove ${deletingTeacher?.user_full_name}? This can be restored later from the database if needed.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deletingTeacher) return;
          try {
            await deleteMutation.mutateAsync(deletingTeacher.id);
            toast.success("Teacher removed");
            if (selectedId === deletingTeacher.id) setSelectedId(null);
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Failed to delete teacher.");
          }
        }}
      />
    </div>
  );
}
