"use client";

import { ChevronLeft, Users, Clock, MapPin, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import type { Group, Student } from "@/types";

interface GroupDetailPanelProps {
  group: Group;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function GroupDetailPanel({ group, onBack, onEdit, onDelete }: GroupDetailPanelProps) {
  // Student no longer carries a groupId (no group/enrollment backend exists
  // yet to keep it in sync with — see types/index.ts::Student) so group
  // membership can't be derived here anymore.
  const students: Student[] = [];

  return (
    <Card noPadding>
      <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <p className="font-semibold text-slate-900">{group.name}</p>
          <p className="text-xs text-slate-500">{group.courseName}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status={group.status} />
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
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Group Information</h4>
          <div className="space-y-3">
            <InfoRow icon={<Users className="h-4 w-4" />} label="Teacher" value={group.teacherName} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Room" value={group.room} />
            <InfoRow icon={<Clock className="h-4 w-4" />} label="Schedule" value={`${group.days.join(", ")} · ${group.startTime}–${group.endTime}`} />
            <InfoRow icon={<Users className="h-4 w-4" />} label="Enrollment" value={`${group.enrolledCount}/${group.capacity}`} />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Enrolled Students</h4>
          {students.length === 0 ? (
            <p className="text-sm text-slate-400">No students enrolled.</p>
          ) : (
            <div className="space-y-1.5">
              {students.map((s) => (
                <div key={s.id} className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2">
                  <Avatar name={s.name} size="xs" />
                  <span className="text-xs text-slate-700 flex-1">{s.name}</span>
                  <StatusBadge status={s.status} />
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
