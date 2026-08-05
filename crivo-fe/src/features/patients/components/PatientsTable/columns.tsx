"use client";

import Link from "next/link";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MuiLink from "@mui/material/Link";
import { GridActionsCellItem, type GridColDef } from "@mui/x-data-grid";

import { formatCpf, formatPhone } from "@/lib/br-masks";
import type { Patient } from "../../types";

type BuildColumnsArgs = {
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
};

export function buildPatientColumns({
  onEdit,
  onDelete,
}: BuildColumnsArgs): GridColDef<Patient>[] {
  return [
    {
      field: "name",
      headerName: "Nome",
      flex: 1.4,
      minWidth: 180,
      // O nome é o caminho para o prontuário — as ações da linha continuam
      // sendo editar/remover o cadastro, que é outra coisa.
      renderCell: ({ row }) => (
        <MuiLink
          component={Link}
          href={`/painel/pacientes/${row.id}`}
          underline="hover"
          sx={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            fontWeight: 500,
          }}
        >
          {row.name}
        </MuiLink>
      ),
    },
    {
      field: "phone",
      headerName: "Telefone",
      flex: 1,
      minWidth: 150,
      valueFormatter: (value: string) => formatPhone(value),
    },
    {
      field: "cpf",
      headerName: "CPF",
      flex: 1,
      minWidth: 140,
      valueFormatter: (value: string | null) =>
        value ? formatCpf(value) : "—",
    },
    {
      field: "email",
      headerName: "E-mail",
      flex: 1.4,
      minWidth: 200,
      valueFormatter: (value: string | null) => value ?? "—",
    },
    {
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
    },
  ];
}
