"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useCoursesStore } from "@/lib/store/courses-store";
import { toast } from "@/lib/store/toast-store";
import { courseSchema, type CourseFormValues } from "@/lib/schemas/course-schema";
import type { Course } from "@/types";

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

const EMPTY_VALUES: CourseFormValues = {
  name: "",
  category: "",
  level: "beginner",
  description: "",
  duration: 12,
  price: 0,
  status: "active",
  color: "#6366f1",
};

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course | null;
}

export function CourseFormDialog({ open, onOpenChange, course }: CourseFormDialogProps) {
  const mode = course ? "edit" : "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Course" : "Edit Course"}</DialogTitle>
        </DialogHeader>
        {open && <CourseFormFields key={course?.id ?? "new"} course={course} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

function CourseFormFields({
  course,
  onOpenChange,
}: {
  course?: Course | null;
  onOpenChange: (open: boolean) => void;
}) {
  const addCourse = useCoursesStore((s) => s.add);
  const updateCourse = useCoursesStore((s) => s.update);

  const [values, setValues] = useState<CourseFormValues>(() =>
    course ? { ...EMPTY_VALUES, ...course } : EMPTY_VALUES
  );
  const [errors, setErrors] = useState<Partial<Record<keyof CourseFormValues, string>>>({});

  const mode = course ? "edit" : "create";

  function setField<K extends keyof CourseFormValues>(key: K, value: CourseFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSubmit() {
    const result = courseSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CourseFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof CourseFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    if (mode === "create") {
      addCourse({ ...result.data, lessonsCount: 0, groupCount: 0, studentCount: 0, createdAt: new Date().toISOString().slice(0, 10) });
      toast.success("Course created");
    } else if (course) {
      updateCourse(course.id, result.data);
      toast.success("Course updated");
    }
    onOpenChange(false);
  }

  return (
    <>
      <DialogBody>
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Course name"
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            error={errors.name}
            className="col-span-2"
          />
          <Input
            placeholder="Category"
            value={values.category}
            onChange={(e) => setField("category", e.target.value)}
            error={errors.category}
          />
          <Select
            options={LEVEL_OPTIONS}
            value={values.level}
            onChange={(e) => setField("level", e.target.value as CourseFormValues["level"])}
          />
          <Textarea
            placeholder="Description"
            value={values.description}
            onChange={(e) => setField("description", e.target.value)}
            error={errors.description}
            className="col-span-2"
          />
          <Input
            type="number"
            placeholder="Duration (weeks)"
            value={values.duration}
            onChange={(e) => setField("duration", Number(e.target.value))}
            error={errors.duration}
          />
          <Input
            type="number"
            placeholder="Price"
            value={values.price}
            onChange={(e) => setField("price", Number(e.target.value))}
            error={errors.price}
          />
          <Select
            options={STATUS_OPTIONS}
            value={values.status}
            onChange={(e) => setField("status", e.target.value as CourseFormValues["status"])}
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={values.color}
              onChange={(e) => setField("color", e.target.value)}
              className="h-9 w-9 rounded-lg border border-slate-200 cursor-pointer"
            />
            <span className="text-sm text-slate-500">Course color</span>
          </div>
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
