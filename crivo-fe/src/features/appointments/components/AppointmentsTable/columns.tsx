"use client";

import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import Chip from "@mui/material/Chip";
import { GridActionsCellItem, type GridColDef } from "@mui/x-data-grid";

import { formatCentsToBRL } from "@/lib/currency";
import { STATUS_COLORS, STATUS_LABELS } from "../../status";
import type { Appointment } from "../../types";

type BuildColumnsArgs = {
  onReschedule: (appointment: Appointment) => void;
  onChangeStatus: (
    appointment: Appointment,
    status: Appointment["status"],
  ) => void;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function buildAppointmentColumns({
  onReschedule,
  onChangeStatus,
}: BuildColumnsArgs): GridColDef<Appointment>[] {
  return [
    {
      field: "startsAt",
      headerName: "Data/Hora",
      width: 140,
      valueFormatter: (value: string) => dateFormatter.format(new Date(value)),
    },
    {
      field: "patient",
      headerName: "Paciente",
      flex: 1.2,
      minWidth: 160,
      valueGetter: (_, row) => row.patient.name,
    },
    {
      field: "professional",
      headerName: "Profissional",
      flex: 1,
      minWidth: 160,
      valueGetter: (_, row) => row.professional.name,
    },
    {
      field: "procedure",
      headerName: "Procedimento",
      flex: 1,
      minWidth: 160,
      valueGetter: (_, row) => row.procedure.name,
    },
    {
      field: "priceInCents",
      headerName: "Preço",
      width: 120,
      valueFormatter: (value: number) => formatCentsToBRL(value),
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: ({ row }) => (
        <Chip
          size="small"
          label={STATUS_LABELS[row.status]}
          color={STATUS_COLORS[row.status]}
          variant={row.status === "SCHEDULED" ? "outlined" : "filled"}
        />
      ),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "",
      width: 60,
      getActions: ({ row }) => {
        const isFinished =
          row.status === "COMPLETED" ||
          row.status === "CANCELLED" ||
          row.status === "NO_SHOW";

        const actions = [
          <GridActionsCellItem
            key="reschedule"
            icon={<EventRepeatOutlinedIcon />}
            label="Reagendar"
            onClick={() => onReschedule(row)}
            showInMenu
            disabled={isFinished}
          />,
        ];

        if (row.status === "SCHEDULED") {
          actions.push(
            <GridActionsCellItem
              key="confirm"
              icon={<CheckCircleOutlinedIcon />}
              label="Confirmar"
              onClick={() => onChangeStatus(row, "CONFIRMED")}
              showInMenu
            />,
          );
        }

        if (row.status === "SCHEDULED" || row.status === "CONFIRMED") {
          actions.push(
            <GridActionsCellItem
              key="complete"
              icon={<TaskAltOutlinedIcon />}
              label="Concluir"
              onClick={() => onChangeStatus(row, "COMPLETED")}
              showInMenu
            />,
            <GridActionsCellItem
              key="no-show"
              icon={<EventBusyOutlinedIcon />}
              label="Marcar falta"
              onClick={() => onChangeStatus(row, "NO_SHOW")}
              showInMenu
            />,
            <GridActionsCellItem
              key="cancel"
              icon={<CancelOutlinedIcon />}
              label="Cancelar"
              onClick={() => onChangeStatus(row, "CANCELLED")}
              showInMenu
            />,
          );
        }

        return actions;
      },
    },
  ];
}
