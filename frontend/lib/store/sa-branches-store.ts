import { createEntityStore } from "./create-entity-store";
import { SA_BRANCHES, type SABranch as BaseSABranch } from "@/lib/super-admin-data";

export interface SABranch extends BaseSABranch {
  deletedAt?: string | null;
}

export const useSABranchesStore = createEntityStore<SABranch>(
  "educore-sa-branches",
  SA_BRANCHES as SABranch[],
  "b"
);
