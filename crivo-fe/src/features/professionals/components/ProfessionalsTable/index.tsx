"use client";

import { useMemo } from "react";

import { AppDataGrid } from "@/components/data-grid";
import type { PaginationMeta, Professional } from "../../types";
import { buildProfessionalColumns } from "./columns";

type ProfessionalsTableProps = {
  professionals: Professional[];
  meta?: PaginationMeta;
  loading?: boolean;
  canManage: boolean;
  onEdit: (professional: Professional) => void;
  onDelete: (professional: Professional) => void;
  onUpdateParams: (updates: Record<string, string | null>) => void;
};

export const ProfessionalsTable = ({
  professionals,
  meta,
  loading,
  canManage,
  onEdit,
  onDelete,
  onUpdateParams,
}: ProfessionalsTableProps) => {
  const columns = useMemo(
    () => buildProfessionalColumns({ onEdit, onDelete, canManage }),
    [onEdit, onDelete, canManage],
  );

  return (
    <AppDataGrid
      rows={professionals}
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
