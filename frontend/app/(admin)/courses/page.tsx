"use client";
import { useState } from "react";
import { Plus, BookOpen, Users, Clock, DollarSign, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/lib/store/toast-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { useCoursesQuery, useDeleteCourseMutation } from "@/lib/queries/courses";
import type { CourseProfile, CourseLevel, CourseStatus } from "@/lib/api/courses";
import { ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import { CourseFormDialog } from "./_components/course-form-dialog";
import { CourseDetailPanel } from "./_components/course-detail-panel";

const LEVEL_OPTIONS = [
  { value: "", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "discontinued", label: "Discontinued" },
];

export default function CoursesPage() {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<CourseLevel | "">("");
  const [statusFilter, setStatusFilter] = useState<CourseStatus | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseProfile | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<CourseProfile | null>(null);

  const {
    data: courses,
    isLoading,
    isError,
    error,
  } = useCoursesQuery({
    organizationId: organizationId ?? "",
    status: statusFilter || undefined,
    level: levelFilter || undefined,
    search: search || undefined,
  });
  const deleteMutation = useDeleteCourseMutation();

  const list = courses ?? [];
  const selectedCourse = list.find((c) => c.id === selectedId) ?? null;

  const stats = {
    total: list.length,
    students: list.reduce((sum, c) => sum + c.student_count, 0),
    lessons: list.reduce((sum, c) => sum + (c.total_lessons ?? 0), 0),
    revenuePotential: list.reduce((sum, c) => sum + Number(c.price ?? 0) * c.student_count, 0),
  };

  const COLUMNS: Column<CourseProfile>[] = [
    {
      key: "name",
      label: "Course",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${row.color ?? "#6366f1"}18` }}
          >
            <BookOpen className="h-4 w-4" style={{ color: row.color ?? "#6366f1" }} />
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-400">{row.code}</p>
          </div>
        </div>
      ),
    },
    { key: "category", label: "Category" },
    {
      key: "level",
      label: "Level",
      render: (val) => <StatusBadge status={String(val)} />,
    },
    {
      key: "group_count",
      label: "Groups",
    },
    {
      key: "student_count",
      label: "Students",
    },
    {
      key: "price",
      label: "Price",
      render: (val) => formatCurrency(Number(val ?? 0)),
    },
    {
      key: "status",
      label: "Status",
      render: (val) => <StatusBadge status={String(val)} />,
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
              setEditingCourse(row);
              setFormOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeletingCourse(row)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        subtitle={`${stats.total} courses available`}
        actions={
          <Button
            onClick={() => {
              setEditingCourse(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New Course
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Courses" value={stats.total} icon={<BookOpen className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Total Students" value={stats.students} icon={<Users className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard label="Total Lessons" value={stats.lessons} icon={<Clock className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Revenue Potential" value={formatCurrency(stats.revenuePotential)} icon={<DollarSign className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
      </div>

      <Card
        noPadding
        title="All Courses"
        subtitle={`Showing ${list.length} courses`}
        actions={
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses..." />
            <Select options={LEVEL_OPTIONS} value={levelFilter} onChange={(e) => setLevelFilter(e.target.value as CourseLevel | "")} className="w-36" />
            <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as CourseStatus | "")} className="w-36" />
          </div>
        }
      >
        {isError ? (
          <div className="flex items-center gap-2 px-6 py-8 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error instanceof ApiError ? error.message : "Failed to load courses."}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading courses…
          </div>
        ) : (
          <DataTable
            columns={COLUMNS}
            data={list}
            keyField="id"
            emptyMessage="No courses found"
            onRowClick={(row) => setSelectedId(row.id)}
          />
        )}
      </Card>

      {selectedCourse && (
        <CourseDetailPanel
          course={selectedCourse}
          onBack={() => setSelectedId(null)}
          onEdit={() => {
            setEditingCourse(selectedCourse);
            setFormOpen(true);
          }}
          onDelete={() => setDeletingCourse(selectedCourse)}
        />
      )}

      <CourseFormDialog open={formOpen} onOpenChange={setFormOpen} course={editingCourse} />

      <ConfirmDialog
        open={!!deletingCourse}
        onOpenChange={(open) => !open && setDeletingCourse(null)}
        title="Delete course"
        description={`Are you sure you want to remove ${deletingCourse?.name}? This can be restored later from the database if needed.`}
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deletingCourse) return;
          try {
            await deleteMutation.mutateAsync(deletingCourse.id);
            toast.success("Course removed");
            if (selectedId === deletingCourse.id) setSelectedId(null);
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Failed to delete course.");
          }
        }}
      />
    </div>
  );
}
