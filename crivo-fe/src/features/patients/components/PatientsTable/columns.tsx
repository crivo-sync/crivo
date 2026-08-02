"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { GridActionsCellItem, type GridColDef } from "@mui/x-data-grid";

import type { Patient } from "../../types";

function formatPhone(phone: string): string {
  const ddd = phone.slice(0, 2);
  const rest = phone.slice(2);
  const middle = rest.length === 9 ? rest.slice(0, 5) : rest.slice(0, 4);
  const end = rest.length === 9 ? rest.slice(5) : rest.slice(4);
  return `(${ddd}) ${middle}-${end}`;
}

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
      valueFormatter: (value: string | null) => value ?? "—",
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
