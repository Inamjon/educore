import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStudent,
  deleteStudent,
  getStudentParents,
  listStudents,
  updateStudent,
  type CreateStudentInput,
  type ListStudentsParams,
  type UpdateStudentInput,
} from "@/lib/api/students";
import { findRoleBySlug, listRoles } from "@/lib/api/roles";

export { useUserQuery } from "@/lib/queries/users";

const studentsKey = (params: ListStudentsParams) => ["students", params] as const;

export function useStudentsQuery(params: ListStudentsParams) {
  return useQuery({
    queryKey: studentsKey(params),
    queryFn: () => listStudents(params),
  });
}

export function useStudentParentsQuery(studentProfileId: string | null) {
  return useQuery({
    queryKey: ["student-parents", studentProfileId],
    queryFn: () => getStudentParents(studentProfileId as string),
    enabled: !!studentProfileId,
  });
}

/** Roles are seeded once per org and rarely change — cache long. */
export function useStudentRoleQuery(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["roles"],
    queryFn: listRoles,
    staleTime: 5 * 60_000,
    enabled: !!organizationId,
    select: (roles) => (organizationId ? findRoleBySlug(roles, organizationId, "student") : undefined),
  });
}

export function useCreateStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStudentInput) => createStudent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useUpdateStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, input }: { profileId: string; input: UpdateStudentInput }) =>
      updateStudent(profileId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useDeleteStudentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => deleteStudent(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
