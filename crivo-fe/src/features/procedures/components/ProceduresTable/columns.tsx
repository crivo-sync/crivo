"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Chip from "@mui/material/Chip";
import { GridActionsCellItem, type GridColDef } from "@mui/x-data-grid";

import { formatCentsToBRL } from "@/lib/currency";
import type { Procedure } from "../../types";

type BuildColumnsArgs = {
  onEdit: (procedure: Procedure) => void;
  onDelete: (procedure: Procedure) => void;
  /** STAFF só lê: sem permissão, a coluna de ações nem é montada. */
  canManage: boolean;
};

export function buildProcedureColumns({
  onEdit,
  onDelete,
  canManage,
}: BuildColumnsArgs): GridColDef<Procedure>[] {
  const columns: GridColDef<Procedure>[] = [
    {
      field: "name",
      headerName: "Nome",
      flex: 1.4,
      minWidth: 180,
    },
    {
      field: "description",
      headerName: "Descrição",
      flex: 1.6,
      minWidth: 200,
      valueFormatter: (value: string | null) => value ?? "—",
    },
    {
      field: "durationMinutes",
      headerName: "Duração",
      width: 110,
      valueFormatter: (value: number) => `${value} min`,
    },
    {
      field: "priceInCents",
      headerName: "Preço",
      width: 130,
      valueFormatter: (value: number) => formatCentsToBRL(value),
    },
    {
      field: "isActive",
      headerName: "Status",
      width: 110,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          label={row.isActive ? "Ativo" : "Inativo"}
          color={row.isActive ? "success" : "default"}
          variant={row.isActive ? "filled" : "outlined"}
        />
      ),
    },
  ];

  if (canManage) {
    columns.push({
      field: "actions",
      type: "actions",
      headerName: "",
      width: 60,
      getActions: ({ row }) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditOutlinedIcon />}
          label="Editar"
          onClick={() => onEdit(row)}
          showInMenu
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteOutlinedIcon />}
          label="Remover"
          onClick={() => onDelete(row)}
          showInMenu
        />,
      ],
    });
  }

  return columns;
}
