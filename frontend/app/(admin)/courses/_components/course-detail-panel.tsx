"use client";

import { ChevronLeft, Clock, DollarSign, BookOpen, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { useGroupsQuery } from "@/lib/queries/groups";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatCurrency } from "@/lib/utils";
import type { CourseProfile } from "@/lib/api/courses";

interface CourseDetailPanelProps {
  course: CourseProfile;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CourseDetailPanel({ course, onBack, onEdit, onDelete }: CourseDetailPanelProps) {
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const { data: groups } = useGroupsQuery({ organizationId: organizationId ?? "", course: course.id });

  return (
    <Card noPadding>
      <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${course.color ?? "#6366f1"}18` }}
        >
          <BookOpen className="h-4 w-4" style={{ color: course.color ?? "#6366f1" }} />
        </div>
        <div>
          <p className="font-semibold text-slate-900">{course.name}</p>
          <p className="text-xs text-slate-500">{course.category}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status={course.level} />
          <StatusBadge status={course.status} />
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Course Details</h4>
          <p className="text-sm text-slate-600">{course.description}</p>
          <div className="space-y-3">
            <InfoRow icon={<Clock className="h-4 w-4" />} label="Duration" value={course.duration_weeks ? `${course.duration_weeks} weeks` : "—"} />
            <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Price" value={formatCurrency(Number(course.price ?? 0))} />
            <InfoRow icon={<BookOpen className="h-4 w-4" />} label="Lessons" value={course.total_lessons ? `${course.total_lessons}` : "—"} />
            <InfoRow icon={<BookOpen className="h-4 w-4" />} label="Code" value={course.code} />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Linked Groups</h4>
          {!groups || groups.length === 0 ? (
            <p className="text-sm text-slate-400">No groups for this course yet.</p>
          ) : (
            <div className="space-y-1.5">
              {groups.map((g) => (
                <div key={g.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs text-slate-700">{g.name}</span>
                  <span className="text-xs text-slate-500">
                    {g.enrolled_count}/{g.max_students} students
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-400 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-slate-400 block">{label}</span>
        <span className="text-sm text-slate-700 font-medium">{value}</span>
      </div>
    </div>
  );
}
