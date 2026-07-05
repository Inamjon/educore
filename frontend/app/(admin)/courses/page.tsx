"use client";
import { useState } from "react";
import { Plus, BookOpen, Users, Clock, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput, Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { COURSES } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import type { Course } from "@/types";

const LEVEL_OPTIONS = [
  { value: "", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  ...Array.from(new Set(COURSES.map((c) => c.category))).map((cat) => ({ value: cat, label: cat })),
];

function CourseCard({ course }: { course: Course }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Color bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: course.color }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${course.color}18` }}
          >
            <BookOpen className="h-5 w-5" style={{ color: course.color }} />
          </div>
          <StatusBadge status={course.level} />
        </div>

        <h3 className="font-semibold text-slate-900 mb-1">{course.name}</h3>
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
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const filtered = COURSES.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = !levelFilter || c.level === levelFilter;
    const matchesCategory = !categoryFilter || c.category === categoryFilter;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const totalRevenuePotential = COURSES.reduce((sum, c) => sum + c.price * c.studentCount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        subtitle={`${COURSES.length} courses available`}
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            New Course
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Courses" value={COURSES.length} icon={<BookOpen className="h-5 w-5 text-indigo-600" />} iconBg="bg-indigo-50" />
        <StatCard label="Total Students" value={COURSES.reduce((s, c) => s + c.studentCount, 0)} icon={<Users className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard label="Total Lessons" value={COURSES.reduce((s, c) => s + c.lessonsCount, 0)} icon={<Clock className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard label="Revenue Potential" value={formatCurrency(totalRevenuePotential)} icon={<DollarSign className="h-5 w-5 text-amber-600" />} iconBg="bg-amber-50" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses..." className="w-64" />
        <Select options={LEVEL_OPTIONS} value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="w-36" />
        <Select options={CATEGORY_OPTIONS} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-40" />
        <span className="text-sm text-slate-400 ml-auto">{filtered.length} courses</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400">
            No courses found
          </div>
        )}
      </div>
    </div>
  );
}
