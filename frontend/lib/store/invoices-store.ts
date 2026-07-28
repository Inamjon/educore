import { createEntityStore } from "./create-entity-store";
import { INVOICES } from "@/lib/data";
import type { Invoice } from "@/types";

export const useInvoicesStore = createEntityStore<Invoice>(
  "educore-admin-invoices",
  INVOICES,
  "inv"
);
