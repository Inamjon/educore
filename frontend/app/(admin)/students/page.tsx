"use client";
import { useMemo, useState } from "react";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useStudentsStore } from "@/lib/store/students-store";
import { toast } from "@/lib/store/toast-store";
import type { Student } from "@/types";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import { StudentFormDialog } from "./_components/student-form-dialog";
import { StudentDetailPanel } from "./_components/student-detail-panel";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
];

const GENDER_OPTIONS = [
  { value: "", label: "All Genders" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export default function StudentsPage() {
  const studentItems = useStudentsStore((s) => s.items);
  const students = useMemo(() => studentItems.filter((s) => !s.deletedAt), [studentItems]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  const filtered = students.filter((s) => {
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.loginId.toLowerCase().includes(search.toLowerCase()) ||
      s.groupName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || s.status === statusFilter;
    const matchesGender = !genderFilter || s.gender === genderFilter;
    return matchesSearch && matchesStatus && matchesGender;
  });

  const selectedStudent = students.find((s) => s.id === selectedId) ?? null;

  const stats = {
    total: students.length,
    active: students.filter((s) => s.status === "active").length,
    inactive: students.filter((s) => s.status === "inactive" || s.status === "suspended").length,
    pending: students.filter((s) => s.status === "pending").length,
  };

  const COLUMNS: Column<Student>[] = [
    {
      key: "name",
      label: "Student",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-400">{row.loginId}</p>
          </div>
        </div>
      ),
    },
    { key: "groupName", label: "Group" },
    { key: "phone", label: "Phone" },
    {
      key: "attendanceRate",
      label: "Attendance",
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full w-16">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${val}%` }} />
          </div>
          <span className="text-sm text-slate-600">{String(val)}%</span>
        </div>
      ),
    },
    {
      key: "balance",
      label: "Balance",
      render: (val) => (
        <span className={Number(val) > 0 ? "text-red-500 font-medium" : "text-emerald-600 font-medium"}>
          {Number(val) > 0 ? `-$${val}` : "Paid"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (val) => <StatusBadge status={String(val)} />,
    },
    {
      key: "enrolledAt",
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
        subtitle={`Showing ${filtered.length} of ${students.length} students`}
        actions={
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..." />
            <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36" />
            <Select options={GENDER_OPTIONS} value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className="w-32" />
          </div>
        }
      >
        <DataTable
          columns={COLUMNS}
          data={filtered}
          keyField="id"
          emptyMessage="No students found"
          onRowClick={(row) => setSelectedId(row.id)}
        />
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
        description={`Are you sure you want to remove ${deletingStudent?.name}? This can be restored later from the database if needed.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deletingStudent) {
            useStudentsStore.getState().softDelete(deletingStudent.id);
            toast.success("Student removed");
            if (selectedId === deletingStudent.id) setSelectedId(null);
          }
        }}
      />
    </div>
  );
}
