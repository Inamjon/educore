"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useGroupsStore } from "@/lib/store/groups-store";
import { useCoursesStore } from "@/lib/store/courses-store";
import { useTeachersStore } from "@/lib/store/teachers-store";
import { toast } from "@/lib/store/toast-store";
import { groupSchema, type GroupFormValues } from "@/lib/schemas/group-schema";
import type { Group, DayOfWeek } from "@/types";

const DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
];

const EMPTY_VALUES: GroupFormValues = {
  name: "",
  courseId: "",
  teacherId: "",
  room: "",
  days: [],
  startTime: "09:00",
  endTime: "10:30",
  capacity: 20,
  startDate: "",
  endDate: "",
  level: "beginner",
  status: "active",
};

interface GroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: Group | null;
}

export function GroupFormDialog({ open, onOpenChange, group }: GroupFormDialogProps) {
  const mode = group ? "edit" : "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Group" : "Edit Group"}</DialogTitle>
        </DialogHeader>
        {open && <GroupFormFields key={group?.id ?? "new"} group={group} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

function GroupFormFields({
  group,
  onOpenChange,
}: {
  group?: Group | null;
  onOpenChange: (open: boolean) => void;
}) {
  const addGroup = useGroupsStore((s) => s.add);
  const updateGroup = useGroupsStore((s) => s.update);
  const courseItems = useCoursesStore((s) => s.items);
  const courses = useMemo(() => courseItems.filter((c) => !c.deletedAt), [courseItems]);
  const teacherItems = useTeachersStore((s) => s.items);
  const teachers = useMemo(() => teacherItems.filter((t) => !t.deletedAt), [teacherItems]);

  const [values, setValues] = useState<GroupFormValues>(() =>
    group ? { ...EMPTY_VALUES, ...group } : EMPTY_VALUES
  );
  const [errors, setErrors] = useState<Partial<Record<keyof GroupFormValues, string>>>({});

  const mode = group ? "edit" : "create";

  function setField<K extends keyof GroupFormValues>(key: K, value: GroupFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function toggleDay(day: DayOfWeek) {
    setValues((v) => ({
      ...v,
      days: v.days.includes(day) ? v.days.filter((d) => d !== day) : [...v.days, day],
    }));
    setErrors((e) => ({ ...e, days: undefined }));
  }

  function handleSubmit() {
    const result = groupSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof GroupFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof GroupFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    const course = courses.find((c) => c.id === result.data.courseId);
    const teacher = teachers.find((t) => t.id === result.data.teacherId);
    const enriched = {
      ...result.data,
      courseName: course?.name ?? "",
      teacherName: teacher?.name ?? "",
    };

    if (mode === "create") {
      addGroup({ ...enriched, enrolledCount: 0 });
      toast.success("Group created");
    } else if (group) {
      updateGroup(group.id, enriched);
      toast.success("Group updated");
    }
    onOpenChange(false);
  }

  return (
    <>
      <DialogBody>
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Group name"
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            error={errors.name}
            className="col-span-2"
          />
          <Select
            placeholder="Select course"
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
            value={values.courseId}
            onChange={(e) => setField("courseId", e.target.value)}
          />
          <Select
            placeholder="Select teacher"
            options={teachers.map((t) => ({ value: t.id, label: t.name }))}
            value={values.teacherId}
            onChange={(e) => setField("teacherId", e.target.value)}
          />
          {(errors.courseId || errors.teacherId) && (
            <p className="col-span-2 -mt-2 text-xs text-red-500">{errors.courseId || errors.teacherId}</p>
          )}
          <Input
            placeholder="Room"
            value={values.room}
            onChange={(e) => setField("room", e.target.value)}
            error={errors.room}
          />
          <Select
            options={LEVEL_OPTIONS}
            value={values.level}
            onChange={(e) => setField("level", e.target.value as GroupFormValues["level"])}
          />

          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Days</label>
            <div className="flex flex-wrap gap-3">
              {DAYS.map((day) => (
                <Checkbox key={day} checked={values.days.includes(day)} onCheckedChange={() => toggleDay(day)} label={day} />
              ))}
            </div>
            {errors.days && <p className="mt-1 text-xs text-red-500">{errors.days}</p>}
          </div>

          <Input
            type="time"
            value={values.startTime}
            onChange={(e) => setField("startTime", e.target.value)}
            error={errors.startTime}
          />
          <Input
            type="time"
            value={values.endTime}
            onChange={(e) => setField("endTime", e.target.value)}
            error={errors.endTime}
          />
          <Input
            type="number"
            placeholder="Capacity"
            value={values.capacity}
            onChange={(e) => setField("capacity", Number(e.target.value))}
            error={errors.capacity}
          />
          <Select
            options={STATUS_OPTIONS}
            value={values.status}
            onChange={(e) => setField("status", e.target.value as GroupFormValues["status"])}
          />
          <Input
            type="date"
            value={values.startDate}
            onChange={(e) => setField("startDate", e.target.value)}
            error={errors.startDate}
          />
          <Input
            type="date"
            value={values.endDate}
            onChange={(e) => setField("endDate", e.target.value)}
            error={errors.endDate}
          />
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>{mode === "create" ? "Create" : "Save"}</Button>
      </DialogFooter>
    </>
  );
}
