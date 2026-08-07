import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLesson,
  deleteLesson,
  listLessons,
  updateLesson,
  type LessonInput,
  type ListLessonsParams,
} from "@/lib/api/schedule";

const lessonsKey = (params: ListLessonsParams) => ["lessons", params] as const;

export function useLessonsQuery(params: ListLessonsParams) {
  return useQuery({
    queryKey: lessonsKey(params),
    queryFn: () => listLessons(params),
    enabled: !!params.organizationId,
  });
}

export function useCreateLessonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LessonInput) => createLesson(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}

export function useUpdateLessonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<LessonInput> }) => updateLesson(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}

export function useDeleteLessonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}
