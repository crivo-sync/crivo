"use client";

import { useMemo } from "react";

import { AppDataGrid } from "@/components/data-grid";
import type { Appointment, AppointmentStatus, PaginationMeta } from "../../types";
import { buildAppointmentColumns } from "./columns";

type AppointmentsTableProps = {
  appointments: Appointment[];
  meta?: PaginationMeta;
  loading?: boolean;
  /** Chegaram depois que a tela abriu — recebem destaque na linha. */
  newIds?: Set<string>;
  onReschedule: (appointment: Appointment) => void;
  onChangeStatus: (appointment: Appointment, status: AppointmentStatus) => void;
  onUpdateParams: (updates: Record<string, string | null>) => void;
};

export const AppointmentsTable = ({
  appointments,
  meta,
  loading,
  newIds,
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
      getRowClassName={(params) =>
        newIds?.has(String(params.id)) ? "crivo-row--new" : ""
      }
      // Barra lateral + fundo suave, não cor chapada: a linha continua
      // legível e o destaque não compete com o chip de status, que é a
      // informação que a recepção lê primeiro.
      sx={{
        "& .crivo-row--new": {
          bgcolor: "primary.50",
          boxShadow: (theme) => `inset 3px 0 0 ${theme.palette.primary.main}`,
          "&:hover": { bgcolor: "primary.100" },
        },
      }}
      onPageChange={(page) => onUpdateParams({ page: String(page) })}
      onPerPageChange={(perPage) =>
        onUpdateParams({ perPage: String(perPage), page: "1" })
      }
    />
  );
};
