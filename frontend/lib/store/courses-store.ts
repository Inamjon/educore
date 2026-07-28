import { createEntityStore } from "./create-entity-store";
import { COURSES } from "@/lib/data";
import type { Course } from "@/types";

export const useCoursesStore = createEntityStore<Course>(
  "educore-admin-courses",
  COURSES,
  "c"
);
