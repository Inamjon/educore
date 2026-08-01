"use client";

import { useEffect, useState } from "react";
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
import { toast } from "@/lib/store/toast-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { studentSchema, type StudentFormValues } from "@/lib/schemas/student-schema";
import { useCreateStudentMutation, useStudentRoleQuery, useUpdateStudentMutation, useUserQuery } from "@/lib/queries/students";
import { ApiError } from "@/lib/api/client";
import type { StudentProfile } from "@/lib/api/students";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "transferred", label: "Transferred" },
  { value: "graduated", label: "Graduated" },
  { value: "expelled", label: "Expelled" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
];

const EMPTY_VALUES: StudentFormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  gender: "male",
  dateOfBirth: "",
  studentCode: "",
  status: "active",
  parentName: "",
  parentPhone: "",
};

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: StudentProfile | null;
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
  student?: StudentProfile | null;
  onOpenChange: (open: boolean) => void;
}) {
  const mode = student ? "edit" : "create";
  const organizationId = useAuthStore((s) => s.user?.organizationId);

  const { data: studentRole } = useStudentRoleQuery(organizationId);
  const { data: userRecord, isLoading: userLoading } = useUserQuery(student?.user ?? null);
  const createMutation = useCreateStudentMutation();
  const updateMutation = useUpdateStudentMutation();

  const [values, setValues] = useState<StudentFormValues>(EMPTY_VALUES);
  const [initialized, setInitialized] = useState(mode === "create");
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormValues, string>>>({});
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && !initialized && userRecord && student) {
      setValues({
        firstName: userRecord.first_name,
        lastName: userRecord.last_name,
        phone: userRecord.phone,
        gender: userRecord.gender ?? "male",
        dateOfBirth: userRecord.date_of_birth ?? "",
        studentCode: student.student_code,
        status: student.status,
        parentName: "",
        parentPhone: "",
      });
      setInitialized(true);
    }
  }, [mode, initialized, userRecord, student]);

  function setField<K extends keyof StudentFormValues>(key: K, value: StudentFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit() {
    const schema = mode === "create" ? studentSchema : studentSchema.omit({ parentName: true, parentPhone: true });
    const result = schema.safeParse(values);
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
      if (!organizationId || !studentRole) {
        toast.error("Student role isn't set up for this organization yet.");
        return;
      }

      setSubmitting(true);
      try {
        await createMutation.mutateAsync({
          organizationId,
          studentRoleId: studentRole.id,
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          gender: values.gender,
          dateOfBirth: values.dateOfBirth,
          password,
          studentCode: values.studentCode,
          status: values.status,
          parentName: values.parentName,
          parentPhone: values.parentPhone,
        });
        toast.success("Student created");
        onOpenChange(false);
      } catch (err) {
        applyServerErrors(err, setErrors);
      } finally {
        setSubmitting(false);
      }
    } else if (student) {
      setSubmitting(true);
      try {
        await updateMutation.mutateAsync({
          profileId: student.id,
          input: {
            userId: student.user,
            firstName: values.firstName,
            lastName: values.lastName,
            phone: values.phone,
            gender: values.gender,
            dateOfBirth: values.dateOfBirth,
            studentCode: values.studentCode,
            status: values.status,
          },
        });
        toast.success("Student updated");
        onOpenChange(false);
      } catch (err) {
        applyServerErrors(err, setErrors);
      } finally {
        setSubmitting(false);
      }
    }
  }

  if (mode === "edit" && (userLoading || !initialized)) {
    return (
      <DialogBody>
        <p className="text-sm text-slate-400 py-8 text-center">Loading student…</p>
      </DialogBody>
    );
  }

  return (
    <>
      <DialogBody>
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="First name"
            value={values.firstName}
            onChange={(e) => setField("firstName", e.target.value)}
            error={errors.firstName}
          />
          <Input
            placeholder="Last name"
            value={values.lastName}
            onChange={(e) => setField("lastName", e.target.value)}
            error={errors.lastName}
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
            placeholder="Student code"
            value={values.studentCode}
            onChange={(e) => setField("studentCode", e.target.value)}
            error={errors.studentCode}
          />
          <Select
            options={STATUS_OPTIONS}
            value={values.status}
            onChange={(e) => setField("status", e.target.value as StudentFormValues["status"])}
            className="col-span-2"
          />

          {mode === "edit" && student && (
            <Input value={student.user_login_id} disabled placeholder="Login ID" className="col-span-2" />
          )}

          {mode === "create" && (
            <>
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

function applyServerErrors(
  err: unknown,
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof StudentFormValues, string>>>>
) {
  if (err instanceof ApiError && err.fieldErrors) {
    const mapped: Partial<Record<keyof StudentFormValues, string>> = {};
    for (const [key, messages] of Object.entries(err.fieldErrors)) {
      const field = key === "student_code" ? "studentCode" : (key as keyof StudentFormValues);
      mapped[field] = messages[0];
    }
    setErrors(mapped);
    toast.error("Please fix the highlighted fields.");
  } else {
    toast.error(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
  }
}
