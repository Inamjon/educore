"use client";
import { useMemo, useState } from "react";
import { Plus, BookOpen, Users, Clock, DollarSign, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCoursesStore } from "@/lib/store/courses-store";
import { toast } from "@/lib/store/toast-store";
import { formatCurrency } from "@/lib/utils";
import type { Course } from "@/types";
import { CourseFormDialog } from "./_components/course-form-dialog";
import { CourseDetailPanel } from "./_components/course-detail-panel";

const LEVEL_OPTIONS = [
  { value: "", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

function CourseCard({
  course,
  onView,
  onEdit,
  onDelete,
}: {
  course: Course;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={onView}>
      <div className="h-1.5 w-full" style={{ backgroundColor: course.color }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${course.color}18` }}
          >
            <BookOpen className="h-5 w-5" style={{ color: course.color }} />
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-slate-900">{course.name}</h3>
          <StatusBadge status={course.level} />
        </div>
        <p className="text-xs text-slate-400 mb-4 line-clamp-2">{course.description}</p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <p className="text-sm font-bold text-slate-900">{course.lessonsCount}</p>
            <p className="text-[10px] text-slate-400">Lessons</p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <p className="text-sm font-bold text-slate-900">{course.groupCount}</p>
            <p className="text-[10px] text-slate-400">Groups</p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <p className="text-sm font-bold text-slate-900">{course.studentCount}</p>
            <p className="text-[10px] text-slate-400">Students</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm border-t border-slate-50 pt-3">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">{course.duration} weeks</span>
          </div>
          <div>
            <span className="text-xs text-slate-400">{course.category}</span>
          </div>
          <p className="font-bold text-slate-900">{formatCurrency(course.price)}</p>
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const courseItems = useCoursesStore((s) => s.items);
  const courses = useMemo(() => courseItems.filter((c) => !c.deletedAt), [courseItems]);
  const softDelete = useCoursesStore((s) => s.softDelete);

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...Array.from(new Set(courses.map((c) => c.category))).map((cat) => ({ value: cat, label: cat })),
  ];

  const filtered = courses.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = !levelFilter || c.level === levelFilter;
    const matchesCategory = !categoryFilter || c.category === categoryFilter;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const selectedCourse = courses.find((c) => c.id === selectedId) ?? null;
  const totalRevenuePotential = courses.reduce((sum, c) => sum + c.price * c.studentCount, 0);

  function openEdit(course: Course) {
    setEditingCourse(course);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        subtitle={`${courses.length} courses available`}
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
        <StatCard label="Total Courses" value={courses.length} icon={<BookOpen className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Total Students" value={courses.reduce((s, c) => s + c.studentCount, 0)} icon={<Users className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard label="Total Lessons" value={courses.reduce((s, c) => s + c.lessonsCount, 0)} icon={<Clock className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Revenue Potential" value={formatCurrency(totalRevenuePotential)} icon={<DollarSign className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses..." className="w-64" />
        <Select options={LEVEL_OPTIONS} value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="w-36" />
        <Select options={categoryOptions} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-40" />
        <span className="text-sm text-slate-400 ml-auto">{filtered.length} courses</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onView={() => setSelectedId(course.id)}
            onEdit={() => openEdit(course)}
            onDelete={() => setDeletingCourse(course)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400">
            No courses found
          </div>
        )}
      </div>

      {selectedCourse && (
        <CourseDetailPanel
          course={selectedCourse}
          onBack={() => setSelectedId(null)}
          onEdit={() => openEdit(selectedCourse)}
          onDelete={() => setDeletingCourse(selectedCourse)}
        />
      )}

      <CourseFormDialog open={formOpen} onOpenChange={setFormOpen} course={editingCourse} />

      <ConfirmDialog
        open={!!deletingCourse}
        onOpenChange={(open) => !open && setDeletingCourse(null)}
        title="Delete course"
        description={`Are you sure you want to remove ${deletingCourse?.name}?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deletingCourse) {
            softDelete(deletingCourse.id);
            toast.success("Course removed");
            if (selectedId === deletingCourse.id) setSelectedId(null);
          }
        }}
      />
    </div>
  );
}
