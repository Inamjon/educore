import { createEntityStore } from "./create-entity-store";
import { SA_CENTERS, type SACenter as BaseSACenter } from "@/lib/super-admin-data";

export interface SACenter extends BaseSACenter {
  deletedAt?: string | null;
}

export const useSACentersStore = createEntityStore<SACenter>(
  "educore-sa-centers",
  SA_CENTERS as SACenter[],
  "c"
);
