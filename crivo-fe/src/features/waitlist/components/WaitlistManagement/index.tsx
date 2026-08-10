"use client";

import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { GridActionsCellItem, type GridColDef } from "@mui/x-data-grid";
import dayjs from "dayjs";

import { AppDataGrid } from "@/components/data-grid";
import { ErrorServer } from "@/components/ui/error-server";
import { formatPhone } from "@/lib/br-masks";
import {
  useMarkWaitlistOffered,
  useRemoveFromWaitlist,
  useWaitlist,
} from "../../hooks/use-waitlist";
import type { WaitlistEntry, WaitlistStatus } from "../../types";
import { AddToWaitlistDialog } from "../AddToWaitlistDialog";

const STATUS_LABELS: Record<WaitlistStatus, string> = {
  WAITING: "Esperando",
  OFFERED: "Vaga oferecida",
  SCHEDULED: "Agendado",
  CANCELLED: "Saiu da fila",
};

const STATUS_COLORS: Record<WaitlistStatus, "default" | "info" | "success"> = {
  WAITING: "default",
  OFFERED: "info",
  SCHEDULED: "success",
  CANCELLED: "default",
};

/** "qualquer data" é mais informativo que um traço vazio. */
function formatWindow(entry: WaitlistEntry): string {
  const from = entry.preferredFrom
    ? dayjs(entry.preferredFrom).format("DD/MM")
    : null;
  const to = entry.preferredTo ? dayjs(entry.preferredTo).format("DD/MM") : null;

  if (!from && !to) return "Qualquer data";
  if (from && to) return `${from} a ${to}`;
  return from ? `A partir de ${from}` : `Até ${to}`;
}

export const WaitlistManagement = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { entries, isLoading, error, refetch } = useWaitlist();
  const markOffered = useMarkWaitlistOffered();
  const removeEntry = useRemoveFromWaitlist();

  const columns: GridColDef<WaitlistEntry>[] = [
    {
      field: "createdAt",
      headerName: "Na fila desde",
      width: 130,
      valueFormatter: (value: string) =>
        dayjs(value).format("DD/MM/YY HH:mm"),
    },
    {
      field: "patient",
      headerName: "Paciente",
      flex: 1.2,
      minWidth: 160,
      valueGetter: (_, row) => row.patient.name,
    },
    {
      field: "phone",
      headerName: "Telefone",
      width: 150,
      valueGetter: (_, row) => formatPhone(row.patient.phone),
    },
    {
      field: "procedure",
      headerName: "Procedimento",
      flex: 1,
      minWidth: 160,
      valueGetter: (_, row) => row.procedure.name,
    },
    {
      field: "professional",
      headerName: "Profissional",
      flex: 1,
      minWidth: 140,
      // Quem não escolheu tem mais chance de encaixe — dizer isso é mais
      // útil do que mostrar vazio.
      valueGetter: (_, row) => row.professional?.name ?? "Qualquer um",
    },
    {
      field: "window",
      headerName: "Aceita",
      width: 150,
      valueGetter: (_, row) => formatWindow(row),
    },
    {
      field: "status",
      headerName: "Situação",
      width: 150,
      renderCell: ({ row }) => (
        <Tooltip
          title={
            row.offeredAt
              ? `Oferecida em ${dayjs(row.offeredAt).format("DD/MM [às] HH:mm")}`
              : (row.notes ?? "")
          }
        >
          <Chip
            size="small"
            label={STATUS_LABELS[row.status]}
            color={STATUS_COLORS[row.status]}
            variant={row.status === "WAITING" ? "outlined" : "filled"}
          />
        </Tooltip>
      ),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "",
      width: 60,
      getActions: ({ row }) => [
        // "Oferecida" só faz sentido para quem ainda espera.
        ...(row.status === "WAITING"
          ? [
              <GridActionsCellItem
                key="offer"
                icon={<CampaignOutlinedIcon />}
                label="Marcar como oferecida"
                // Sem `appointmentId`: aqui a recepção só registra que avisou
                // por fora. O aviso automático sai pelo dialog que aparece ao
                // cancelar um agendamento, onde existe uma vaga concreta.
                onClick={() => markOffered.mutate({ id: row.id })}
                showInMenu
              />,
            ]
          : []),
        <GridActionsCellItem
          key="remove"
          icon={<DeleteOutlinedIcon />}
          label="Tirar da fila"
          onClick={() => removeEntry.mutate(row.id)}
          showInMenu
        />,
      ],
    },
  ];

  if (error) {
    return <ErrorServer message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <Paper
      elevation={1}
      sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Quem entrou primeiro tem preferência quando abre uma vaga.
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Adicionar à espera
        </Button>
      </Box>

      {isLoading ? (
        <Skeleton variant="rounded" height={280} />
      ) : entries.length === 0 ? (
        <Alert severity="info">
          Ninguém na lista de espera. Quando a agenda estiver cheia, coloque
          aqui quem quer ser avisado se abrir vaga.
        </Alert>
      ) : (
        <AppDataGrid rows={entries} columns={columns} hideFooter />
      )}

      {/* Remontado a cada abertura: o formulário precisa nascer limpo, e
          zerar por efeito causaria render em cascata. */}
      {dialogOpen && (
        <AddToWaitlistDialog open onOpenChange={setDialogOpen} />
      )}
    </Paper>
  );
};
