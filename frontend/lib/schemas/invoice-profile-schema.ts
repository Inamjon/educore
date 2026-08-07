import { z } from "zod";

// Real-API form schema for the Admin Finance page. Kept separate from
// lib/schemas/invoice-schema.ts, the mock-store schema — nothing else in
// the app depends on the mock Invoice store, so it (and that old schema)
// become dead code once this page is wired. `invoice_number`/`status` are
// server-generated/defaulted, not collected here.
export const invoiceProfileSchema = z.object({
  studentProfile: z.string().min(1, "Student is required"),
  group: z.string().optional(),
  totalAmount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
});

export type InvoiceProfileFormValues = z.infer<typeof invoiceProfileSchema>;

export const recordPaymentSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.enum(["cash", "card", "bank_transfer", "online", "mobile_payment", "other"]),
});

export type RecordPaymentFormValues = z.infer<typeof recordPaymentSchema>;
