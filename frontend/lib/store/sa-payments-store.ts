import { createEntityStore } from "./create-entity-store";
import { SA_PAYMENTS, type SAPayment as BaseSAPayment } from "@/lib/super-admin-data";

export interface SAPayment extends BaseSAPayment {
  deletedAt?: string | null;
}

export const useSAPaymentsStore = createEntityStore<SAPayment>(
  "educore-sa-payments",
  SA_PAYMENTS as SAPayment[],
  "p"
);
