"use client";

import { useMemo } from "react";

import { AppDataGrid } from "@/components/data-grid";
import type { PaginationMeta, Procedure } from "../../types";
import { buildProcedureColumns } from "./columns";

type ProceduresTableProps = {
  procedures: Procedure[];
  meta?: PaginationMeta;
  loading?: boolean;
  canManage: boolean;
  onEdit: (procedure: Procedure) => void;
  onDelete: (procedure: Procedure) => void;
  onUpdateParams: (updates: Record<string, string | null>) => void;
};

export const ProceduresTable = ({
  procedures,
  meta,
  loading,
  canManage,
  onEdit,
  onDelete,
  onUpdateParams,
}: ProceduresTableProps) => {
  const columns = useMemo(
    () => buildProcedureColumns({ onEdit, onDelete, canManage }),
    [onEdit, onDelete, canManage],
  );

  return (
    <AppDataGrid
      rows={procedures}
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
