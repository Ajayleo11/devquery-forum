import { apiRequest } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export interface PresignedUrlResponse {
  presignedUrl: string;
  key: string;
}

const getPresignedUrl = async (data: {
  fileName: string;
  fileType: string;
}): Promise<PresignedUrlResponse> =>
  apiRequest("/api/upload/presigned-url", {
    method: "POST",
    body: JSON.stringify(data),
  });

const uploadToS3 = async ({
  presignedUrl,
  file,
}: {
  presignedUrl: string;
  file: File;
}): Promise<void> => {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!response.ok) throw new Error("Failed to upload file to S3");
};

export const useUploadImage = () => {
  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const result = await getPresignedUrl({
        fileName: file.name,
        fileType: file.type,
      });
      await uploadToS3({ presignedUrl: result.presignedUrl, file });
      return result.key;
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image";
      toast.error(errorMessage);
    },
  });
};