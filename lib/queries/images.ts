import { useQuery, useQueries } from "@tanstack/react-query";
import { apiRequest, queryKeys } from "@/lib/api";

export interface ImageUrlResponse {
  url: string;
}

const getImageUrl = async (key: string): Promise<ImageUrlResponse> =>
  apiRequest("/api/upload/image-url", {
    method: "POST",
    body: JSON.stringify({ key }),
  });

export const useImageUrl = (key: string) => {
  return useQuery({
    queryKey: queryKeys.images.url(key),
    queryFn: () => getImageUrl(key),
    enabled: !!key,
    staleTime: 1000 * 60 * 60,
  });
};

export const useImageUrls = (keys: string[]) => {
  return useQueries({
    queries: keys.map((key) => ({
      queryKey: queryKeys.images.url(key),
      queryFn: () => getImageUrl(key),
      enabled: !!key,
      staleTime: 1000 * 60 * 60,
    })),
  });
};