const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  let data;
  try {
    data = await response.json();
  } catch (error) {
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    throw new Error("Failed to parse response");
  }

  if (!response.ok) {
    const errorMessage =
      data?.error ||
      data?.message ||
      `API Error: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return data;
}

export const queryKeys = {
  questions: {
    all: ["questions"] as const,
    lists: () => [...queryKeys.questions.all, "list"] as const,
    list: (filters: { page?: number; limit?: number; tag?: string }) =>
      [...queryKeys.questions.lists(), filters] as const,
    details: () => [...queryKeys.questions.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.questions.details(), id] as const,
    search: (query: string) =>
      [...queryKeys.questions.all, "search", query] as const,
  },
  users: {
    all: ["users"] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    profile: (id: string) =>
      [...queryKeys.users.detail(id), "profile"] as const,
  },
  answers: {
    all: ["answers"] as const,
    lists: () => [...queryKeys.answers.all, "list"] as const,
    list: (questionId: string) =>
      [...queryKeys.answers.lists(), questionId] as const,
    details: () => [...queryKeys.answers.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.answers.details(), id] as const,
  },
  tags: {
    all: ["tags"] as const,
    lists: () => [...queryKeys.tags.all, "list"] as const,
    detail: (id: string) => [...queryKeys.tags.all, "detail", id] as const,
  },
  images: {
    url: (key: string) => ["images", "url", key] as const,
    urls: (keys: string[]) => ["images", "urls", keys] as const,
  },
} as const;

import type { answers, questions, tags, user, userProfile } from "@/lib/db/schema";

export type User = typeof user.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Answer = typeof answers.$inferSelect;
export type UserProfile = typeof userProfile.$inferSelect;
export type Tag = typeof tags.$inferSelect;

export type QuestionWithAuthor = Omit<Question, "authorId"> & {
  author: User;
  tags: string[];
};

export type AnswerWithAuthor = Omit<Answer, "authorId"> & {
  author: User | null;
};

export type AnswerWithQuestion = Omit<Answer, "questionId"> & {
  question?: {
    id: number;
    title: string;
  } | null;
};

export type UserWithProfile = User & {
  profile?: UserProfile | null;
  _count?: {
    questions: number;
    answers: number;
  };
};