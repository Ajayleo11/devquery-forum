import { useQuery } from "@tanstack/react-query";
import { queryKeys, apiRequest, type QuestionWithAuthor } from "@/lib/api";

export interface SearchResponse {
  results: QuestionWithAuthor[];
  data: {
    questions: QuestionWithAuthor[];
  };
}

const search = async (query: string): Promise<SearchResponse> => {
  const result = await apiRequest<{ results: QuestionWithAuthor[] }>(
    `/api/search?q=${encodeURIComponent(query)}`
  );
  return {
    results: result.results,
    data: { questions: result.results },
  };
};

export const useSearch = (query: string) => {
  return useQuery({
    queryKey: queryKeys.questions.search(query),
    queryFn: () => search(query),
    enabled: !!query && query.trim().length > 0,
    staleTime: 1000 * 60 * 2,
  });
};