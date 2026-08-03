"use client";

import { useQuery } from "@tanstack/react-query";

import { useSessionExpiredGuard } from "@/hooks/use-session-expired-guard";
import { getUsersAction } from "../actions/get-users-action";

export const USERS_QUERY_KEY = ["users"] as const;

export function useUsers() {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: async () => {
      const result = await getUsersAction();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
  });

  useSessionExpiredGuard(error);

  return {
    users: data ?? [],
    isLoading,
    isFetching,
    error,
    refetch,
  };
}
