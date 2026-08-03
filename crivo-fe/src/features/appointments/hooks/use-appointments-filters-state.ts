"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { AppointmentStatus } from "../types";

export function useAppointmentsFiltersState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "10");
  const professionalId = searchParams.get("professionalId") ?? "";
  const patientId = searchParams.get("patientId") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const status = (searchParams.get("status") ?? "") as AppointmentStatus | "";

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

  return {
    page,
    perPage,
    professionalId,
    patientId,
    from,
    to,
    status,
    updateParams,
    clearFilters: () =>
      updateParams({
        professionalId: null,
        patientId: null,
        from: null,
        to: null,
        status: null,
        page: "1",
      }),
  };
}
