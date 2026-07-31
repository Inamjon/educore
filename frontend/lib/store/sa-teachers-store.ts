import { createEntityStore } from "./create-entity-store";
import { SA_TEACHERS, type SATeacher as BaseSATeacher } from "@/lib/super-admin-data";

export interface SATeacher extends BaseSATeacher {
  deletedAt?: string | null;
}

export const useSATeachersStore = createEntityStore<SATeacher>(
  "educore-sa-teachers",
  SA_TEACHERS as SATeacher[],
  "t"
);
