import { createEntityStore } from "./create-entity-store";
import { SA_STUDENTS, type SAStudent as BaseSAStudent } from "@/lib/super-admin-data";

export interface SAStudent extends BaseSAStudent {
  deletedAt?: string | null;
}

export const useSAStudentsStore = createEntityStore<SAStudent>(
  "educore-sa-students",
  SA_STUDENTS as SAStudent[],
  "s"
);
