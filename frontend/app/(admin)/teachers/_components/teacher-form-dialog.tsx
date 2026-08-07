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
import { teacherProfileSchema, type TeacherProfileFormValues } from "@/lib/schemas/teacher-profile-schema";
import {
  useCreateTeacherMutation,
  useTeacherRoleQuery,
  useUpdateTeacherMutation,
  useUserQuery,
} from "@/lib/queries/teachers";
import { ApiError } from "@/lib/api/client";
import type { TeacherProfile } from "@/lib/api/teachers";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
];

const EMPLOYMENT_OPTIONS = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "intern", label: "Intern" },
];

const EMPTY_VALUES: TeacherProfileFormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  gender: "male",
  teacherCode: "",
  status: "active",
  employmentType: "full_time",
  specialization: "",
  salary: 0,
};

interface TeacherFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher?: TeacherProfile | null;
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
  teacher?: TeacherProfile | null;
  onOpenChange: (open: boolean) => void;
}) {
  const mode = teacher ? "edit" : "create";
  const organizationId = useAuthStore((s) => s.user?.organizationId);

  const { data: teacherRole } = useTeacherRoleQuery(organizationId);
  const { data: userRecord, isLoading: userLoading } = useUserQuery(teacher?.user ?? null);
  const createMutation = useCreateTeacherMutation();
  const updateMutation = useUpdateTeacherMutation();

  const [values, setValues] = useState<TeacherProfileFormValues>(EMPTY_VALUES);
  const [initialized, setInitialized] = useState(mode === "create");
  const [errors, setErrors] = useState<Partial<Record<keyof TeacherProfileFormValues, string>>>({});
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && !initialized && userRecord && teacher) {
      setValues({
        firstName: userRecord.first_name,
        lastName: userRecord.last_name,
        phone: userRecord.phone,
        gender: userRecord.gender ?? "male",
        teacherCode: teacher.teacher_code,
        status: teacher.status,
        employmentType: teacher.employment_type,
        specialization: "",
        salary: 0,
      });
      setInitialized(true);
    }
  }, [mode, initialized, userRecord, teacher]);

  function setField<K extends keyof TeacherProfileFormValues>(key: K, value: TeacherProfileFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit() {
    const schema = mode === "create" ? teacherProfileSchema : teacherProfileSchema.omit({ specialization: true, salary: true });
    const result = schema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof TeacherProfileFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof TeacherProfileFormValues;
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
      if (!organizationId || !teacherRole) {
        toast.error("Teacher role isn't set up for this organization yet.");
        return;
      }

      setSubmitting(true);
      try {
        await createMutation.mutateAsync({
          organizationId,
          teacherRoleId: teacherRole.id,
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          gender: values.gender,
          password,
          teacherCode: values.teacherCode,
          status: values.status,
          employmentType: values.employmentType,
          specialization: values.specialization,
          salary: values.salary,
        });
        toast.success("Teacher created");
        onOpenChange(false);
      } catch (err) {
        applyServerErrors(err, setErrors);
      } finally {
        setSubmitting(false);
      }
    } else if (teacher) {
      setSubmitting(true);
      try {
        await updateMutation.mutateAsync({
          profileId: teacher.id,
          input: {
            userId: teacher.user,
            firstName: values.firstName,
            lastName: values.lastName,
            phone: values.phone,
            gender: values.gender,
            teacherCode: values.teacherCode,
            status: values.status,
            employmentType: values.employmentType,
          },
        });
        toast.success("Teacher updated");
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
        <p className="text-sm text-slate-400 py-8 text-center">Loading teacher…</p>
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
            onChange={(e) => setField("gender", e.target.value as TeacherProfileFormValues["gender"])}
          />
          <Input
            placeholder="Teacher code"
            value={values.teacherCode}
            onChange={(e) => setField("teacherCode", e.target.value)}
            error={errors.teacherCode}
          />
          <Select
            options={EMPLOYMENT_OPTIONS}
            value={values.employmentType}
            onChange={(e) => setField("employmentType", e.target.value as TeacherProfileFormValues["employmentType"])}
          />
          <Select
            options={STATUS_OPTIONS}
            value={values.status}
            onChange={(e) => setField("status", e.target.value as TeacherProfileFormValues["status"])}
            className="col-span-2"
          />

          {mode === "edit" && teacher && (
            <Input value={teacher.user_login_id} disabled placeholder="Login ID" className="col-span-2" />
          )}

          {mode === "create" && (
            <>
              <Input
                placeholder="Specialization (e.g. Mathematics)"
                value={values.specialization}
                onChange={(e) => setField("specialization", e.target.value)}
                error={errors.specialization}
                className="col-span-2"
              />
              <Input
                type="number"
                placeholder="Monthly salary"
                value={values.salary}
                onChange={(e) => setField("salary", Number(e.target.value))}
                error={errors.salary}
                className="col-span-2"
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
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof TeacherProfileFormValues, string>>>>
) {
  if (err instanceof ApiError && err.fieldErrors) {
    const mapped: Partial<Record<keyof TeacherProfileFormValues, string>> = {};
    for (const [key, messages] of Object.entries(err.fieldErrors)) {
      const field = key === "teacher_code" ? "teacherCode" : key === "employment_type" ? "employmentType" : (key as keyof TeacherProfileFormValues);
      mapped[field] = messages[0];
    }
    setErrors(mapped);
    toast.error("Please fix the highlighted fields.");
  } else {
    toast.error(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
  }
}
