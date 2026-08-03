"use client";

import { useMemo } from "react";

import { AppDataGrid } from "@/components/data-grid";
import type { Appointment, AppointmentStatus, PaginationMeta } from "../../types";
import { buildAppointmentColumns } from "./columns";

type AppointmentsTableProps = {
  appointments: Appointment[];
  meta?: PaginationMeta;
  loading?: boolean;
  onReschedule: (appointment: Appointment) => void;
  onChangeStatus: (appointment: Appointment, status: AppointmentStatus) => void;
  onUpdateParams: (updates: Record<string, string | null>) => void;
};

export const AppointmentsTable = ({
  appointments,
  meta,
  loading,
  onReschedule,
  onChangeStatus,
  onUpdateParams,
}: AppointmentsTableProps) => {
  const columns = useMemo(
    () => buildAppointmentColumns({ onReschedule, onChangeStatus }),
    [onReschedule, onChangeStatus],
  );

  return (
    <AppDataGrid
      rows={appointments}
      columns={columns}
      loading={loading}
      paginationMeta={meta}
      onPageChange={(page) => onUpdateParams({ page: String(page) })}
      onPerPageChange={(perPage) =>
        onUpdateParams({ perPage: String(perPage), page: "1" })
      }
    />
  );
};
