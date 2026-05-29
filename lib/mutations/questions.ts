import { apiRequest, queryKeys, type QuestionWithAuthor } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const createQuestion = async (data: {
  title: string;
  body: string;
  images: string[];
}): Promise<{ data: QuestionWithAuthor }> => {
  return apiRequest("/api/questions", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const useCreateQuestion = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: createQuestion,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questions.lists() });
      toast.success("Question created successfully!");
      router.push(`/questions/${response.data.id}`);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to create question";
      toast.error(errorMessage);
    },
  });
};