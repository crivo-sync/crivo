"use client";

import { useMemo } from "react";

import { AppDataGrid } from "@/components/data-grid";
import type { PaginationMeta, Patient } from "../../types";
import { buildPatientColumns } from "./columns";

type PatientsTableProps = {
  patients: Patient[];
  meta?: PaginationMeta;
  loading?: boolean;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  onUpdateParams: (updates: Record<string, string | null>) => void;
};

export const PatientsTable = ({
  patients,
  meta,
  loading,
  onEdit,
  onDelete,
  onUpdateParams,
}: PatientsTableProps) => {
  const columns = useMemo(
    () => buildPatientColumns({ onEdit, onDelete }),
    [onEdit, onDelete],
  );

  return (
    <AppDataGrid
      rows={patients}
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
