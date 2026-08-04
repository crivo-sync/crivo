"use client";

import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Chip from "@mui/material/Chip";
import { GridActionsCellItem, type GridColDef } from "@mui/x-data-grid";

import type { User } from "../../types";

const ROLE_LABELS: Record<User["role"], string> = {
  ADMIN: "Administrador",
  PROFESSIONAL: "Profissional",
  STAFF: "Recepção",
};

/** Só ADMIN se destaca: é o papel que pode mexer em cadastro e configuração. */
const ROLE_COLORS: Record<User["role"], "primary" | "info" | "default"> = {
  ADMIN: "primary",
  PROFESSIONAL: "info",
  STAFF: "default",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

type BuildColumnsArgs = {
  currentUserId: string;
  onEdit: (user: User) => void;
  onToggleActive: (user: User) => void;
};

export function buildUserColumns({
  currentUserId,
  onEdit,
  onToggleActive,
}: BuildColumnsArgs): GridColDef<User>[] {
  return [
    {
      field: "name",
      headerName: "Nome",
      flex: 1.2,
      minWidth: 180,
    },
    {
      field: "email",
      headerName: "E-mail",
      flex: 1.4,
      minWidth: 220,
    },
    {
      field: "role",
      headerName: "Papel",
      width: 150,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          label={ROLE_LABELS[row.role]}
          color={ROLE_COLORS[row.role]}
        />
      ),
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
    {
      field: "createdAt",
      headerName: "Desde",
      width: 110,
      valueFormatter: (value: string) => dateFormatter.format(new Date(value)),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "",
      width: 60,
      getActions: ({ row }) => {
        // Regra do backend (UpdateUserUseCase): o admin não pode rebaixar
        // nem desativar a própria conta — evita ficar trancado fora do
        // tenant. Espelhado aqui para não oferecer uma ação que sempre
        // voltaria 400.
        const isSelf = row.id === currentUserId;

        const actions = [
          <GridActionsCellItem
            key="edit"
            icon={<EditOutlinedIcon />}
            label="Editar"
            onClick={() => onEdit(row)}
            showInMenu
          />,
        ];

        if (!isSelf) {
          actions.push(
            <GridActionsCellItem
              key="toggle-active"
              icon={row.isActive ? <BlockOutlinedIcon /> : <CheckCircleOutlinedIcon />}
              label={row.isActive ? "Desativar" : "Reativar"}
              onClick={() => onToggleActive(row)}
              showInMenu
            />,
          );
        }

        return actions;
      },
    },
  ];
}
