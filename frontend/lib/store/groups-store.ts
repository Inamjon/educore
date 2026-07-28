import { createEntityStore } from "./create-entity-store";
import { GROUPS } from "@/lib/data";
import type { Group } from "@/types";

export const useGroupsStore = createEntityStore<Group>(
  "educore-admin-groups",
  GROUPS,
  "g"
);
