"use client";

import { useQuery } from "@tanstack/react-query";

import { getProfileAction } from "../actions/get-profile-action";

export const PROFILE_QUERY_KEY = ["profile"] as const;

export function useProfile() {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      const result = await getProfileAction();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.data;
    },
  });

  return { profile: data, isLoading, isFetching, error, refetch };
}
