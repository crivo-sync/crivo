"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { formatCentsToBRL } from "@/lib/currency";
import { formatDuration } from "@/lib/duration";
import { STATUS_COLORS, STATUS_LABELS } from "@/features/appointments/status";
import type {
  Appointment,
  AppointmentStatus,
} from "@/features/appointments/types";

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

/** Cabe na tela sem rolar; acima disso o painel virava uma lista sem fim. */
const PER_PAGE = 5;

/**
 * A borda esquerda repete a cor do chip de status — é o que permite varrer a
 * lista e achar o que precisa de ação sem ler linha por linha.
 */
const STATUS_BORDER: Record<AppointmentStatus, string> = {
  SCHEDULED: "grey.400",
  CONFIRMED: "info.main",
  COMPLETED: "success.main",
  CANCELLED: "error.main",
  NO_SHOW: "warning.main",
};

type AppointmentsListProps = {
  appointments: Appointment[];
  emptyMessage: string;
};

export const AppointmentsList = ({
  appointments,
  emptyMessage,
}: AppointmentsListProps) => {
  const [status, setStatus] = useState<AppointmentStatus | "">("");
  const [page, setPage] = useState(1);

  // Só oferece status que existem na lista: opção de filtro que não leva a
  // lugar nenhum faz o usuário achar que a tela quebrou.
  const availableStatuses = useMemo(
    () =>
      (Object.keys(STATUS_LABELS) as AppointmentStatus[]).filter((value) =>
        appointments.some((appointment) => appointment.status === value),
      ),
    [appointments],
  );

  const filtered = useMemo(
    () =>
      status
        ? appointments.filter((appointment) => appointment.status === status)
        : appointments,
    [appointments, status],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  // Filtrar encolhe a lista: sem esse clamp a tela ficaria vazia apontando
  // para uma página que não existe mais.
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE,
  );

  if (appointments.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary", py: 2 }}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {availableStatuses.length > 1 && (
        <TextField
          select
          label="Status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as AppointmentStatus | "");
            setPage(1);
          }}
          sx={{ maxWidth: 200 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {availableStatuses.map((value) => (
            <MenuItem key={value} value={value}>
              {STATUS_LABELS[value]}
            </MenuItem>
          ))}
        </TextField>
      )}

      <Stack spacing={1}>
        {visible.map((appointment) => (
          <Box
            key={appointment.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 1.5,
              pl: 2,
              borderRadius: 2,
              border: 1,
              borderColor: "divider",
              borderLeft: 4,
              borderLeftColor: STATUS_BORDER[appointment.status],
            }}
          >
            <Box sx={{ minWidth: 60 }}>
              <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {timeFormatter.format(new Date(appointment.startsAt))}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {formatDuration(appointment.procedure.durationMinutes)}
              </Typography>
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600 }} noWrap>
                {appointment.patient.name}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary" }}
                noWrap
              >
                {appointment.procedure.name} · {appointment.professional.name}
              </Typography>
            </Box>

            <Stack spacing={0.5} sx={{ alignItems: "flex-end" }}>
              <Typography sx={{ fontWeight: 700 }}>
                {formatCentsToBRL(appointment.priceInCents)}
              </Typography>
              <Chip
                size="small"
                label={STATUS_LABELS[appointment.status]}
                color={STATUS_COLORS[appointment.status]}
                variant={
                  appointment.status === "SCHEDULED" ? "outlined" : "filled"
                }
              />
            </Stack>
          </Box>
        ))}
      </Stack>

      {filtered.length === 0 && (
        <Typography variant="body2" sx={{ color: "text.secondary", py: 1 }}>
          Nenhum agendamento com esse status.
        </Typography>
      )}

      {pageCount > 1 && (
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {filtered.length} agendamento{filtered.length === 1 ? "" : "s"}
          </Typography>
          <Pagination
            size="small"
            count={pageCount}
            page={safePage}
            onChange={(_, value) => setPage(value)}
          />
        </Stack>
      )}
    </Stack>
  );
};
