import { createEntityStore } from "./create-entity-store";
import { SA_ADMINS, type SAAdmin as BaseSAAdmin } from "@/lib/super-admin-data";

export interface SAAdmin extends BaseSAAdmin {
  deletedAt?: string | null;
}

export const useSAAdministratorsStore = createEntityStore<SAAdmin>(
  "educore-sa-administrators",
  SA_ADMINS as SAAdmin[],
  "a"
);
