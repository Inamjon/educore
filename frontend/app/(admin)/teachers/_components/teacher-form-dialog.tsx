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
import { useTeachersStore } from "@/lib/store/teachers-store";
import { toast } from "@/lib/store/toast-store";
import { teacherSchema, type TeacherFormValues } from "@/lib/schemas/teacher-schema";
import { generateLoginId } from "@/lib/utils";
import type { Teacher } from "@/types";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
];

const EMPTY_VALUES: TeacherFormValues = {
  name: "",
  phone: "",
  gender: "male",
  specialization: "",
  subjects: [],
  status: "active",
  salary: 0,
};

interface TeacherFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher?: Teacher | null;
}

export function TeacherFormDialog({ open, onOpenChange, teacher }: TeacherFormDialogProps) {
  const mode = teacher ? "edit" : "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Teacher" : "Edit Teacher"}</DialogTitle>
        </DialogHeader>
        {open && (
          <TeacherFormFields key={teacher?.id ?? "new"} teacher={teacher} onOpenChange={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TeacherFormFields({
  teacher,
  onOpenChange,
}: {
  teacher?: Teacher | null;
  onOpenChange: (open: boolean) => void;
}) {
  const addTeacher = useTeachersStore((s) => s.add);
  const updateTeacher = useTeachersStore((s) => s.update);

  const [values, setValues] = useState<TeacherFormValues>(() =>
    teacher ? { ...EMPTY_VALUES, ...teacher } : EMPTY_VALUES
  );
  const [subjectsInput, setSubjectsInput] = useState(() => (teacher ? teacher.subjects.join(", ") : ""));
  const [errors, setErrors] = useState<Partial<Record<keyof TeacherFormValues, string>>>({});
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const mode = teacher ? "edit" : "create";

  function setField<K extends keyof TeacherFormValues>(key: K, value: TeacherFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSubmit() {
    const subjects = subjectsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const candidate = { ...values, subjects };
    const result = teacherSchema.safeParse(candidate);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof TeacherFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof TeacherFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    if (mode === "create") {
      if (!password || password.length < 6) {
        setPasswordError("Password must be at least 6 characters");
        return;
      }
      if (password !== confirmPassword) {
        setPasswordError("Passwords do not match");
        return;
      }
      addTeacher({
        ...result.data,
        loginId: generateLoginId("TCH"),
        groupCount: 0,
        studentCount: 0,
        joinedAt: new Date().toISOString().slice(0, 10),
        rating: 0,
      });
      toast.success("Teacher created");
    } else if (teacher) {
      updateTeacher(teacher.id, result.data);
      toast.success("Teacher updated");
    }
    onOpenChange(false);
  }

  return (
    <>
      <DialogBody>
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Full name"
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            error={errors.name}
            className="col-span-2"
          />
          <Input
            placeholder="Phone"
            value={values.phone}
            onChange={(e) => setField("phone", e.target.value)}
            error={errors.phone}
          />
          <Select
            options={GENDER_OPTIONS}
            value={values.gender}
            onChange={(e) => setField("gender", e.target.value as TeacherFormValues["gender"])}
          />
          <Input
            placeholder="Specialization"
            value={values.specialization}
            onChange={(e) => setField("specialization", e.target.value)}
            error={errors.specialization}
          />
          <Input
            placeholder="Subjects (comma separated)"
            value={subjectsInput}
            onChange={(e) => setSubjectsInput(e.target.value)}
            error={errors.subjects}
            className="col-span-2"
          />
          <Input
            type="number"
            placeholder="Monthly salary"
            value={values.salary}
            onChange={(e) => setField("salary", Number(e.target.value))}
            error={errors.salary}
          />
          <Select
            options={STATUS_OPTIONS}
            value={values.status}
            onChange={(e) => setField("status", e.target.value as TeacherFormValues["status"])}
          />

          {mode === "edit" && teacher && (
            <Input value={teacher.loginId} disabled placeholder="Login ID" className="col-span-2" />
          )}

          {mode === "create" && (
            <>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(undefined); }}
                error={passwordError}
              />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(undefined); }}
              />
              <p className="col-span-2 -mt-2 text-xs text-slate-400">
                A Login ID will be generated automatically after creation.
              </p>
            </>
          )}
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
