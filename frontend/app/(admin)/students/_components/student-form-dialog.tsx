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
import { useStudentsStore } from "@/lib/store/students-store";
import { toast } from "@/lib/store/toast-store";
import { studentSchema, type StudentFormValues } from "@/lib/schemas/student-schema";
import { generateLoginId } from "@/lib/utils";
import type { Student } from "@/types";

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

const EMPTY_VALUES: StudentFormValues = {
  name: "",
  phone: "",
  gender: "male",
  dateOfBirth: "",
  address: "",
  parentName: "",
  parentPhone: "",
  status: "active",
};

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
}

export function StudentFormDialog({ open, onOpenChange, student }: StudentFormDialogProps) {
  const mode = student ? "edit" : "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Student" : "Edit Student"}</DialogTitle>
        </DialogHeader>
        {open && (
          <StudentFormFields key={student?.id ?? "new"} student={student} onOpenChange={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function StudentFormFields({
  student,
  onOpenChange,
}: {
  student?: Student | null;
  onOpenChange: (open: boolean) => void;
}) {
  const addStudent = useStudentsStore((s) => s.add);
  const updateStudent = useStudentsStore((s) => s.update);

  const [values, setValues] = useState<StudentFormValues>(() =>
    student ? { ...EMPTY_VALUES, ...student } : EMPTY_VALUES
  );
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormValues, string>>>({});
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const mode = student ? "edit" : "create";

  function setField<K extends keyof StudentFormValues>(key: K, value: StudentFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSubmit() {
    const result = studentSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof StudentFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof StudentFormValues;
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
      addStudent({
        ...result.data,
        loginId: generateLoginId("STU"),
        enrolledAt: new Date().toISOString().slice(0, 10),
      });
      toast.success("Student created");
    } else if (student) {
      updateStudent(student.id, result.data);
      toast.success("Student updated");
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
            onChange={(e) => setField("gender", e.target.value as StudentFormValues["gender"])}
          />
          <Input
            type="date"
            value={values.dateOfBirth}
            onChange={(e) => setField("dateOfBirth", e.target.value)}
            error={errors.dateOfBirth}
          />
          <Input
            placeholder="Address"
            value={values.address}
            onChange={(e) => setField("address", e.target.value)}
            error={errors.address}
            className="col-span-2"
          />
          <Input
            placeholder="Parent name"
            value={values.parentName}
            onChange={(e) => setField("parentName", e.target.value)}
            error={errors.parentName}
          />
          <Input
            placeholder="Parent phone"
            value={values.parentPhone}
            onChange={(e) => setField("parentPhone", e.target.value)}
            error={errors.parentPhone}
          />
          <Select
            options={STATUS_OPTIONS}
            value={values.status}
            onChange={(e) => setField("status", e.target.value as StudentFormValues["status"])}
            className="col-span-2"
          />

          {mode === "edit" && student && (
            <Input value={student.loginId} disabled placeholder="Login ID" className="col-span-2" />
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
