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
import { useInvoicesStore } from "@/lib/store/invoices-store";
import { useStudentsStore } from "@/lib/store/students-store";
import { toast } from "@/lib/store/toast-store";
import { invoiceSchema, type InvoiceFormValues } from "@/lib/schemas/invoice-schema";

const EMPTY_VALUES: InvoiceFormValues = {
  studentId: "",
  studentName: "",
  groupName: "",
  amount: 0,
  dueDate: "",
};

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceFormDialog({ open, onOpenChange }: InvoiceFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Invoice</DialogTitle>
        </DialogHeader>
        {open && <InvoiceFormFields onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

function InvoiceFormFields({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const addInvoice = useInvoicesStore((s) => s.add);
  const studentItems = useStudentsStore((s) => s.items);
  const students = useMemo(() => studentItems.filter((s) => !s.deletedAt), [studentItems]);

  const [values, setValues] = useState<InvoiceFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Partial<Record<keyof InvoiceFormValues, string>>>({});

  function setField<K extends keyof InvoiceFormValues>(key: K, value: InvoiceFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleStudentChange(studentId: string) {
    const student = students.find((s) => s.id === studentId);
    setValues((v) => ({ ...v, studentId, studentName: student?.name ?? "" }));
    setErrors((e) => ({ ...e, studentId: undefined }));
  }

  function handleSubmit() {
    const result = invoiceSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof InvoiceFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof InvoiceFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    addInvoice({
      ...result.data,
      paid: 0,
      balance: result.data.amount,
      status: "pending",
      createdAt: new Date().toISOString().slice(0, 10),
    });
    toast.success("Invoice created");
    onOpenChange(false);
  }

  return (
    <>
      <DialogBody>
        <div className="grid grid-cols-2 gap-3">
          <Select
            placeholder="Select student"
            options={students.map((s) => ({ value: s.id, label: s.name }))}
            value={values.studentId}
            onChange={(e) => handleStudentChange(e.target.value)}
            className="col-span-2"
          />
          {errors.studentId && <p className="col-span-2 -mt-2 text-xs text-red-500">{errors.studentId}</p>}
          <Input
            type="number"
            placeholder="Amount"
            value={values.amount}
            onChange={(e) => setField("amount", Number(e.target.value))}
            error={errors.amount}
          />
          <Input
            type="date"
            value={values.dueDate}
            onChange={(e) => setField("dueDate", e.target.value)}
            error={errors.dueDate}
          />
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Create</Button>
      </DialogFooter>
    </>
  );
}
