"use client";

import { Clock, MapPin, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/badge";

export interface ScheduleLesson {
  id: string;
  groupId: string;
  groupName: string;
  courseColor: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  topic: string;
  status: "completed" | "scheduled" | "cancelled";
}

interface LessonDetailDialogProps {
  lesson: ScheduleLesson | null;
  onOpenChange: (open: boolean) => void;
}

export function LessonDetailDialog({ lesson, onOpenChange }: LessonDetailDialogProps) {
  return (
    <Dialog open={!!lesson} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        {lesson && (
          <>
            <DialogHeader>
              <DialogTitle>{lesson.groupName}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  {new Date(lesson.date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <StatusBadge status={lesson.status} />
              </div>
              <InfoRow icon={<BookOpen className="h-4 w-4" />} label="Topic" value={lesson.topic} />
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Room" value={lesson.room} />
              <InfoRow
                icon={<Clock className="h-4 w-4" />}
                label="Time"
                value={`${lesson.startTime} – ${lesson.endTime}`}
              />
            </DialogBody>
          </>
        )}
      </DialogContent>
    </Dialog>
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
