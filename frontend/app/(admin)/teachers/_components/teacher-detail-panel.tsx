"use client";

import { useMemo } from "react";
import { ChevronLeft, Mail, Phone, Star, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { useGroupsStore } from "@/lib/store/groups-store";
import { formatCurrency } from "@/lib/utils";
import type { Teacher } from "@/types";

interface TeacherDetailPanelProps {
  teacher: Teacher;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TeacherDetailPanel({ teacher, onBack, onEdit, onDelete }: TeacherDetailPanelProps) {
  const groupItems = useGroupsStore((s) => s.items);
  const groups = useMemo(
    () => groupItems.filter((g) => !g.deletedAt && g.teacherId === teacher.id),
    [groupItems, teacher.id]
  );

  return (
    <Card noPadding>
      <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Avatar name={teacher.name} size="md" />
          <div>
            <p className="font-semibold text-slate-900">{teacher.name}</p>
            <p className="text-xs text-slate-500">{teacher.specialization}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status={teacher.status} />
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
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Contact Information</h4>
          <div className="space-y-3">
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={teacher.email} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={teacher.phone} />
            <InfoRow icon={<Star className="h-4 w-4" />} label="Rating" value={`${teacher.rating}`} />
            <InfoRow icon={<Star className="h-4 w-4" />} label="Monthly Salary" value={formatCurrency(teacher.salary)} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {teacher.subjects.map((s) => (
              <span key={s} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Assigned Groups</h4>
          {groups.length === 0 ? (
            <p className="text-sm text-slate-400">No groups assigned.</p>
          ) : (
            <div className="space-y-1.5">
              {groups.map((g) => (
                <div key={g.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs text-slate-700">{g.name}</span>
                  <span className="text-xs text-slate-500">
                    {g.enrolledCount}/{g.capacity} students
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
