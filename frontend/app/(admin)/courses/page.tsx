"use client";
import { useState } from "react";
import { Plus, BookOpen, Users, Clock, DollarSign, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
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

export default function CoursesPage() {
  const t = useTranslations("AdminCourses");

  const LEVEL_OPTIONS = [
    { value: "", label: t("levelAll") },
    { value: "beginner", label: t("levelBeginner") },
    { value: "intermediate", label: t("levelIntermediate") },
    { value: "advanced", label: t("levelAdvanced") },
  ];

  const STATUS_OPTIONS = [
    { value: "", label: t("statusAll") },
    { value: "draft", label: t("statusDraft") },
    { value: "active", label: t("statusActive") },
    { value: "archived", label: t("statusArchived") },
    { value: "discontinued", label: t("statusDiscontinued") },
  ];

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
      label: t("columnCourse"),
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
    { key: "category", label: t("columnCategory") },
    {
      key: "level",
      label: t("columnLevel"),
      render: (val) => <StatusBadge status={String(val)} />,
    },
    {
      key: "group_count",
      label: t("columnGroups"),
    },
    {
      key: "student_count",
      label: t("columnStudents"),
    },
    {
      key: "price",
      label: t("columnPrice"),
      render: (val) => formatCurrency(Number(val ?? 0)),
    },
    {
      key: "status",
      label: t("columnStatus"),
      render: (val) => <StatusBadge status={String(val)} />,
    },
    {
      key: "id",
      label: t("columnActions"),
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
        title={t("pageTitle")}
        subtitle={t("pageSubtitleCount", { count: stats.total })}
        actions={
          <Button
            onClick={() => {
              setEditingCourse(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t("newCourseButton")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t("statTotalCourses")} value={stats.total} icon={<BookOpen className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label={t("statTotalStudents")} value={stats.students} icon={<Users className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard label={t("statTotalLessons")} value={stats.lessons} icon={<Clock className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label={t("statRevenuePotential")} value={formatCurrency(stats.revenuePotential)} icon={<DollarSign className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
      </div>

      <Card
        noPadding
        title={t("allCoursesTitle")}
        subtitle={t("showingCount", { count: list.length })}
        actions={
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchPlaceholder")} />
            <Select options={LEVEL_OPTIONS} value={levelFilter} onChange={(e) => setLevelFilter(e.target.value as CourseLevel | "")} className="w-36" />
            <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as CourseStatus | "")} className="w-36" />
          </div>
        }
      >
        {isError ? (
          <div className="flex items-center gap-2 px-6 py-8 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error instanceof ApiError ? error.message : t("loadErrorFallback")}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("loadingCourses")}
          </div>
        ) : (
          <DataTable
            columns={COLUMNS}
            data={list}
            keyField="id"
            emptyMessage={t("noCoursesFound")}
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
        title={t("deleteDialogTitle")}
        description={t("deleteDialogDescription", { name: deletingCourse?.name ?? "" })}
        confirmLabel={t("deleteConfirmLabel")}
        onConfirm={async () => {
          if (!deletingCourse) return;
          try {
            await deleteMutation.mutateAsync(deletingCourse.id);
            toast.success(t("deleteSuccessToast"));
            if (selectedId === deletingCourse.id) setSelectedId(null);
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : t("deleteErrorFallback"));
          }
        }}
      />
    </div>
  );
}
