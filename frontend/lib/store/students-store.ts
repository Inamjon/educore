import { createEntityStore } from "./create-entity-store";
import { STUDENTS } from "@/lib/data";
import type { Student } from "@/types";

export const useStudentsStore = createEntityStore<Student>(
  "educore-admin-students",
  STUDENTS,
  "s"
);
