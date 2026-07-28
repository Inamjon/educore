import { z } from "zod";

export const invoiceSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  studentName: z.string().min(1),
  groupName: z.string().min(1, "Group is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  dueDate: z.string().min(1, "Due date is required"),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;
