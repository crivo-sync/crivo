"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Chip from "@mui/material/Chip";
import { GridActionsCellItem, type GridColDef } from "@mui/x-data-grid";

import { formatPhone } from "@/lib/br-masks";
import type { Professional } from "../../types";

type BuildColumnsArgs = {
  onEdit: (professional: Professional) => void;
  onDelete: (professional: Professional) => void;
  /** STAFF só lê: sem permissão, a coluna de ações nem é montada. */
  canManage: boolean;
};

export function buildProfessionalColumns({
  onEdit,
  onDelete,
  canManage,
}: BuildColumnsArgs): GridColDef<Professional>[] {
  const columns: GridColDef<Professional>[] = [
    {
      field: "name",
      headerName: "Nome",
      flex: 1.4,
      minWidth: 180,
    },
    {
      field: "specialty",
      headerName: "Especialidade",
      flex: 1,
      minWidth: 150,
      valueFormatter: (value: string | null) => value ?? "—",
    },
    {
      field: "councilCode",
      headerName: "Registro",
      flex: 0.9,
      minWidth: 130,
      valueFormatter: (value: string | null) => value ?? "—",
    },
    {
      field: "phone",
      headerName: "Telefone",
      flex: 1,
      minWidth: 150,
      valueFormatter: (value: string | null) =>
        value ? formatPhone(value) : "—",
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
