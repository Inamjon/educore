"use client";

import { Clock, MapPin, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { toast } from "@/lib/store/toast-store";
import { useUpdateLessonMutation } from "@/lib/queries/schedule";
import { ApiError } from "@/lib/api/client";
import type { Lesson } from "@/lib/api/schedule";

interface LessonDetailDialogProps {
  lesson: Lesson | null;
  onOpenChange: (open: boolean) => void;
}

export function LessonDetailDialog({ lesson, onOpenChange }: LessonDetailDialogProps) {
  const updateMutation = useUpdateLessonMutation();

  async function setStatus(status: "completed" | "cancelled") {
    if (!lesson) return;
    try {
      await updateMutation.mutateAsync({ id: lesson.id, input: { status } });
      toast.success(status === "cancelled" ? "Lesson cancelled" : "Lesson marked completed");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={!!lesson} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        {lesson && (
          <>
            <DialogHeader>
              <DialogTitle>{lesson.group_name}</DialogTitle>
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
              <InfoRow icon={<BookOpen className="h-4 w-4" />} label="Topic" value={lesson.topic || "—"} />
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Room" value={lesson.room || "—"} />
              <InfoRow
                icon={<Clock className="h-4 w-4" />}
                label="Time"
                value={`${lesson.start_time.slice(0, 5)} – ${lesson.end_time.slice(0, 5)}`}
              />
            </DialogBody>
            {lesson.status === "scheduled" && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setStatus("cancelled")} loading={updateMutation.isPending}>
                  Cancel Lesson
                </Button>
                <Button onClick={() => setStatus("completed")} loading={updateMutation.isPending}>
                  Mark Completed
                </Button>
              </DialogFooter>
            )}
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
