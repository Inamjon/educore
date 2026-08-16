import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createExam,
  createExamResult,
  listExamResults,
  listExams,
  updateExam,
  updateExamResult,
  type ExamInput,
  type ListExamResultsParams,
  type ListExamsParams,
} from "@/lib/api/exams";

const examsKey = (params: ListExamsParams) => ["exams", params] as const;
const examResultsKey = (params: ListExamResultsParams) => ["examResults", params] as const;

export function useExamsQuery(params: ListExamsParams) {
  return useQuery({
    queryKey: examsKey(params),
    queryFn: () => listExams(params),
    enabled: !!params.organizationId,
  });
}

export function useExamResultsQuery(params: ListExamResultsParams) {
  return useQuery({
    queryKey: examResultsKey(params),
    queryFn: () => listExamResults(params),
    enabled: !!params.organizationId,
  });
}

export function useCreateExamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExamInput) => createExam(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
  });
}

export function useUpdateExamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ExamInput> }) => updateExam(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
  });
}

/** Create-or-update depending on whether a result row already exists for
 * this student on this exam — mirrors how Teacher Attendance's save flow
 * already handles "some students already have a row, some don't" without a
 * dedicated bulk endpoint. */
export function useSaveExamResultMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      organizationId,
      examId,
      studentProfileId,
      existingResultId,
      score,
    }: {
      organizationId: string;
      examId: string;
      studentProfileId: string;
      existingResultId: string | null;
      score: number;
    }) =>
      existingResultId
        ? updateExamResult(existingResultId, score)
        : createExamResult({ organizationId, exam: examId, studentProfile: studentProfileId, score }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examResults"] });
    },
  });
}
