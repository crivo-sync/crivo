"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

export function usePatientsFiltersState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "10");
  const urlSearch = searchParams.get("search") ?? "";

  const { control, reset } = useForm({ defaultValues: { search: urlSearch } });
  const watchedSearch = useWatch({ control, name: "search" });

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      });
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router],
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (watchedSearch !== urlSearch) {
        updateParams({ search: watchedSearch ?? "", page: "1" });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [watchedSearch, urlSearch, updateParams]);

  return {
    control,
    page,
    perPage,
    urlSearch,
    updateParams,
    clearFilters: () => {
      reset({ search: "" });
      updateParams({ search: null, page: "1" });
    },
  };
}
