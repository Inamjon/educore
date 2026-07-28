"use client";
import { useMemo, useState } from "react";
import { UserPlus, Star, Users2, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTeachersStore } from "@/lib/store/teachers-store";
import { toast } from "@/lib/store/toast-store";
import { formatCurrency } from "@/lib/utils";
import type { Teacher } from "@/types";
import { GraduationCap, UserCheck } from "lucide-react";
import { TeacherFormDialog } from "./_components/teacher-form-dialog";
import { TeacherDetailPanel } from "./_components/teacher-detail-panel";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function TeacherCard({
  teacher,
  onView,
  onEdit,
  onDelete,
}: {
  teacher: Teacher;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onView}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar name={teacher.name} size="lg" />
          <div>
            <h3 className="font-semibold text-slate-900">{teacher.name}</h3>
            <p className="text-sm text-slate-500">{teacher.specialization}</p>
          </div>
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

      <div className="flex flex-wrap gap-1.5 mb-4">
        {teacher.subjects.map((s) => (
          <span key={s} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium">
            {s}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-slate-50 rounded-xl">
          <p className="text-lg font-bold text-slate-900">{teacher.groupCount}</p>
          <p className="text-xs text-slate-400">Groups</p>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded-xl">
          <p className="text-lg font-bold text-slate-900">{teacher.studentCount}</p>
          <p className="text-xs text-slate-400">Students</p>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded-xl">
          <div className="flex items-center justify-center gap-0.5">
            <p className="text-lg font-bold text-slate-900">{teacher.rating}</p>
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-xs text-slate-400">Rating</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm border-t border-slate-50 pt-3">
        <div>
          <p className="text-xs text-slate-400">Monthly Salary</p>
          <p className="font-semibold text-slate-900">{formatCurrency(teacher.salary)}</p>
        </div>
        <StatusBadge status={teacher.status} />
      </div>
    </div>
  );
}

export default function TeachersPage() {
  const teacherItems = useTeachersStore((s) => s.items);
  const teachers = useMemo(() => teacherItems.filter((t) => !t.deletedAt), [teacherItems]);
  const softDelete = useTeachersStore((s) => s.softDelete);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);

  const filtered = teachers.filter((t) => {
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.specialization.toLowerCase().includes(search.toLowerCase()) ||
      t.subjects.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedTeacher = teachers.find((t) => t.id === selectedId) ?? null;
  const totalStudents = teachers.reduce((sum, t) => sum + t.studentCount, 0);
  const avgRating = teachers.length ? (teachers.reduce((sum, t) => sum + t.rating, 0) / teachers.length).toFixed(1) : "0.0";

  function openEdit(teacher: Teacher) {
    setEditingTeacher(teacher);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        subtitle={`${teachers.length} teachers on staff`}
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
        <StatCard label="Total Teachers" value={teachers.length} icon={<GraduationCap className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Active Teachers" value={teachers.filter((t) => t.status === "active").length} icon={<UserCheck className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Total Students" value={totalStudents} icon={<Users2 className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard label="Avg. Rating" value={avgRating} icon={<Star className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-50" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teachers..." className="w-64" />
        <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36" />
        <div className="ml-auto flex items-center gap-2">
          <Button variant={view === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setView("grid")}>Grid</Button>
          <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setView("list")}>List</Button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              onView={() => setSelectedId(teacher.id)}
              onEdit={() => openEdit(teacher)}
              onDelete={() => setDeletingTeacher(teacher)}
            />
          ))}
        </div>
      ) : (
        <Card noPadding>
          <div className="divide-y divide-slate-50">
            {filtered.map((teacher) => (
              <div
                key={teacher.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setSelectedId(teacher.id)}
              >
                <Avatar name={teacher.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{teacher.name}</p>
                  <p className="text-sm text-slate-500">{teacher.specialization}</p>
                </div>
                <div className="hidden sm:flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-slate-900">{teacher.groupCount}</p>
                    <p className="text-xs text-slate-400">Groups</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-900">{teacher.studentCount}</p>
                    <p className="text-xs text-slate-400">Students</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-0.5">
                      <p className="font-semibold text-slate-900">{teacher.rating}</p>
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    </div>
                    <p className="text-xs text-slate-400">Rating</p>
                  </div>
                </div>
                <StatusBadge status={teacher.status} />
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(teacher)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeletingTeacher(teacher)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedTeacher && (
        <TeacherDetailPanel
          teacher={selectedTeacher}
          onBack={() => setSelectedId(null)}
          onEdit={() => openEdit(selectedTeacher)}
          onDelete={() => setDeletingTeacher(selectedTeacher)}
        />
      )}

      <TeacherFormDialog open={formOpen} onOpenChange={setFormOpen} teacher={editingTeacher} />

      <ConfirmDialog
        open={!!deletingTeacher}
        onOpenChange={(open) => !open && setDeletingTeacher(null)}
        title="Delete teacher"
        description={`Are you sure you want to remove ${deletingTeacher?.name}?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deletingTeacher) {
            softDelete(deletingTeacher.id);
            toast.success("Teacher removed");
            if (selectedId === deletingTeacher.id) setSelectedId(null);
          }
        }}
      />
    </div>
  );
}
