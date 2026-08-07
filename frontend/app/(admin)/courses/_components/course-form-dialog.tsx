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
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "@/lib/store/toast-store";
import { courseProfileSchema, type CourseProfileFormValues } from "@/lib/schemas/course-profile-schema";
import { useCreateCourseMutation, useUpdateCourseMutation } from "@/lib/queries/courses";
import { ApiError } from "@/lib/api/client";
import type { CourseProfile } from "@/lib/api/courses";

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "discontinued", label: "Discontinued" },
];

const EMPTY_VALUES: CourseProfileFormValues = {
  name: "",
  category: "",
  level: "beginner",
  description: "",
  durationWeeks: 12,
  price: 0,
  status: "draft",
  color: "#6366f1",
};

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: CourseProfile | null;
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
  course?: CourseProfile | null;
  onOpenChange: (open: boolean) => void;
}) {
  const mode = course ? "edit" : "create";
  const organizationId = useAuthStore((s) => s.user?.organizationId);
  const createMutation = useCreateCourseMutation();
  const updateMutation = useUpdateCourseMutation();

  const [values, setValues] = useState<CourseProfileFormValues>(() =>
    course
      ? {
          name: course.name,
          category: course.category,
          level: course.level,
          description: course.description ?? "",
          durationWeeks: course.duration_weeks ?? 1,
          price: Number(course.price ?? 0),
          status: course.status,
          color: course.color ?? "#6366f1",
        }
      : EMPTY_VALUES
  );
  const [errors, setErrors] = useState<Partial<Record<keyof CourseProfileFormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function setField<K extends keyof CourseProfileFormValues>(key: K, value: CourseProfileFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit() {
    const result = courseProfileSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CourseProfileFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof CourseProfileFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "create") {
        if (!organizationId) {
          toast.error("No organization on this account.");
          return;
        }
        await createMutation.mutateAsync({ organizationId, ...result.data });
        toast.success("Course created");
      } else if (course) {
        await updateMutation.mutateAsync({ courseId: course.id, input: result.data });
        toast.success("Course updated");
      }
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        const mapped: Partial<Record<keyof CourseProfileFormValues, string>> = {};
        for (const [key, messages] of Object.entries(err.fieldErrors)) {
          const field = key === "duration_weeks" ? "durationWeeks" : (key as keyof CourseProfileFormValues);
          mapped[field] = messages[0];
        }
        setErrors(mapped);
        toast.error("Please fix the highlighted fields.");
      } else {
        toast.error(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
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
            onChange={(e) => setField("level", e.target.value as CourseProfileFormValues["level"])}
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
            value={values.durationWeeks}
            onChange={(e) => setField("durationWeeks", Number(e.target.value))}
            error={errors.durationWeeks}
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
            onChange={(e) => setField("status", e.target.value as CourseProfileFormValues["status"])}
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

          {mode === "edit" && course && (
            <Input value={course.code} disabled placeholder="Course code" className="col-span-2" />
          )}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={submitting}>
          {mode === "create" ? "Create" : "Save"}
        </Button>
      </DialogFooter>
    </>
  );
}
