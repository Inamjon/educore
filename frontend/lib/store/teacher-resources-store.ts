import { createEntityStore } from "./create-entity-store";
import { TEACHER_RESOURCES } from "@/lib/teacher-data";

export interface TeacherResource {
  id: string;
  title: string;
  subject: string;
  type: "pdf" | "video" | "document" | "image" | "link";
  size: string;
  uploadedAt: string;
  groupId?: string;
  groupName?: string;
  downloads: number;
  shared: boolean;
  deletedAt?: string | null;
}

export const useTeacherResourcesStore = createEntityStore<TeacherResource>(
  "educore-teacher-resources",
  TEACHER_RESOURCES as TeacherResource[],
  "res"
);
