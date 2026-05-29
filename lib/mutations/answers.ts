import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys, apiRequest } from "@/lib/api";
import { toast } from "sonner";

interface CreateAnswerData {
  questionId: string;
  content: string;
}

interface AcceptAnswerData {
  answerId: number;
  questionId: string;
}

interface DeleteAnswerData {
  answerId: number;
  questionId: string;
}

interface AcceptAnswerResponse {
  success: boolean;
  message: string;
  accepted: boolean;
}

export const useCreateAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questionId, content }: CreateAnswerData) => {
      return apiRequest(`/api/answers`, {
        method: "POST",
        body: JSON.stringify({ questionId, content }),
      });
    },
    onSuccess: (_, { questionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.detail(questionId) });
      toast.success("Answer submitted successfully!");
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit answer";
      toast.error(errorMessage);
    },
  });
};

export const useAcceptAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation<AcceptAnswerResponse, Error, AcceptAnswerData>({
    mutationFn: async ({ answerId }: AcceptAnswerData) => {
      return apiRequest(`/api/answers/${answerId}/accept`, { method: "POST" });
    },
    onSuccess: (data, { questionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.detail(questionId) });
      if (data.accepted) {
        toast.success("Answer accepted!");
      } else {
        toast.success("Answer unaccepted");
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to accept answer";
      toast.error(errorMessage);
    },
  });
};

export const useDeleteAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ answerId }: DeleteAnswerData) => {
      return apiRequest(`/api/answers/${answerId}`, { method: "DELETE" });
    },
    onSuccess: (_, { questionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.detail(questionId) });
      toast.success("Answer deleted successfully");
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete answer";
      toast.error(errorMessage);
    },
  });
};