"use client";

import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { GridColDef } from "@mui/x-data-grid";

import { formatPhone } from "@/lib/br-masks";
import { CHANNEL_LABELS, STATUS_COLORS, STATUS_LABELS, TYPE_LABELS } from "../../status";
import type { Message } from "../../types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function buildMessageColumns(): GridColDef<Message>[] {
  return [
    {
      field: "createdAt",
      headerName: "Criada em",
      width: 130,
      valueFormatter: (value: string) => dateFormatter.format(new Date(value)),
    },
    {
      field: "patient",
      headerName: "Paciente",
      flex: 1.2,
      minWidth: 180,
      valueGetter: (_, row) => row.appointment?.patient.name ?? "—",
    },
    {
      field: "toPhone",
      headerName: "Telefone",
      width: 150,
      valueFormatter: (value: string) => formatPhone(value),
    },
    {
      field: "channel",
      headerName: "Canal",
      width: 110,
      valueFormatter: (value: Message["channel"]) => CHANNEL_LABELS[value],
    },
    {
      field: "type",
      headerName: "Tipo",
      flex: 1,
      // "Lembrete de agendamento" precisa caber em uma linha só — abaixo
      // disso o DataGrid quebra o texto e desalinha a altura das linhas.
      minWidth: 210,
      valueFormatter: (value: Message["type"]) => TYPE_LABELS[value],
    },
    {
      field: "body",
      headerName: "Mensagem",
      flex: 1.6,
      minWidth: 220,
      renderCell: ({ row }) => (
        <Tooltip title={<Typography sx={{ whiteSpace: "pre-line" }}>{row.body}</Typography>}>
          {/* `renderCell` não herda o alinhamento vertical das células
              padrão — sem o flex + height:100% o texto encosta no topo. */}
          <Typography
            variant="body2"
            noWrap
            sx={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {row.body}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "attempts",
      headerName: "Tentativas",
      width: 100,
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: ({ row }) => (
        <Tooltip title={row.status === "FAILED" ? row.lastError ?? "" : ""}>
          <Chip
            size="small"
            label={STATUS_LABELS[row.status]}
            color={STATUS_COLORS[row.status]}
            variant={row.status === "PENDING" ? "outlined" : "filled"}
          />
        </Tooltip>
      ),
    },
    {
      field: "failedAt",
      headerName: "Falhou em",
      width: 130,
      // Ver a hora exata da falha, sem abrir cada linha, é o que deixa dar
      // pra cruzar rápido com "ah, foi quando o WhatsApp caiu às 15h" em vez
      // de só saber que "5 mensagens falharam" sem quando.
      valueFormatter: (value: string | null) =>
        value ? dateFormatter.format(new Date(value)) : "—",
    },
  ];
}
