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
import { useDeleteStudentMutation, useStudentsQuery } from "@/lib/queries/students";
import type { StudentProfile, StudentStatus } from "@/lib/api/students";
import { ApiError } from "@/lib/api/client";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import { StudentFormDialog } from "./_components/student-form-dialog";
import { StudentDetailPanel } from "./_components/student-detail-panel";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "transferred", label: "Transferred" },
  { value: "graduated", label: "Graduated" },
  { value: "expelled", label: "Expelled" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
];

export default function StudentsPage() {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentProfile | null>(null);

  const {
    data: students,
    isLoading,
    isError,
    error,
  } = useStudentsQuery({
    organizationId: organizationId ?? "",
    status: statusFilter || undefined,
    search: search || undefined,
  });
  const deleteMutation = useDeleteStudentMutation();

  const list = students ?? [];
  const selectedStudent = list.find((s) => s.id === selectedId) ?? null;

  const stats = {
    total: list.length,
    active: list.filter((s) => s.status === "active").length,
    inactive: list.filter((s) => s.status === "inactive" || s.status === "on_leave").length,
    pending: list.filter((s) => s.status === "pending").length,
  };

  const COLUMNS: Column<StudentProfile>[] = [
    {
      key: "user_full_name",
      label: "Student",
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
    {
      key: "status",
      label: "Status",
      render: (val) => <StatusBadge status={String(val)} />,
    },
    {
      key: "enrollment_date",
      label: "Enrolled",
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
              setEditingStudent(row);
              setFormOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeletingStudent(row)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        subtitle={`${stats.total} students enrolled`}
        actions={
          <Button
            onClick={() => {
              setEditingStudent(null);
              setFormOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            Add Student
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={stats.total} icon={<Users className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Active" value={stats.active} icon={<UserCheck className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Inactive" value={stats.inactive} icon={<UserX className="h-5 w-5 text-red-500" />} iconBg="bg-red-50" />
        <StatCard label="Pending" value={stats.pending} icon={<Clock className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
      </div>

      <Card
        noPadding
        title="All Students"
        subtitle={`Showing ${list.length} students`}
        actions={
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..." />
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StudentStatus | "")}
              className="w-36"
            />
          </div>
        }
      >
        {isError ? (
          <div className="flex items-center gap-2 px-6 py-8 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error instanceof ApiError ? error.message : "Failed to load students."}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading students…
          </div>
        ) : (
          <DataTable
            columns={COLUMNS}
            data={list}
            keyField="id"
            emptyMessage="No students found"
            onRowClick={(row) => setSelectedId(row.id)}
          />
        )}
      </Card>

      {selectedStudent && (
        <StudentDetailPanel
          student={selectedStudent}
          onBack={() => setSelectedId(null)}
          onEdit={() => {
            setEditingStudent(selectedStudent);
            setFormOpen(true);
          }}
          onDelete={() => setDeletingStudent(selectedStudent)}
        />
      )}

      <StudentFormDialog open={formOpen} onOpenChange={setFormOpen} student={editingStudent} />

      <ConfirmDialog
        open={!!deletingStudent}
        onOpenChange={(open) => !open && setDeletingStudent(null)}
        title="Delete student"
        description={`Are you sure you want to remove ${deletingStudent?.user_full_name}? This can be restored later from the database if needed.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deletingStudent) return;
          try {
            await deleteMutation.mutateAsync(deletingStudent.id);
            toast.success("Student removed");
            if (selectedId === deletingStudent.id) setSelectedId(null);
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Failed to delete student.");
          }
        }}
      />
    </div>
  );
}
