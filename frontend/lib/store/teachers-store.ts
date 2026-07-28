import { createEntityStore } from "./create-entity-store";
import { TEACHERS } from "@/lib/data";
import type { Teacher } from "@/types";

export const useTeachersStore = createEntityStore<Teacher>(
  "educore-admin-teachers",
  TEACHERS,
  "t"
);
