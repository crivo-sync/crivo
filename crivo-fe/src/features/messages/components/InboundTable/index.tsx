"use client";

import { useMemo } from "react";
import DoneIcon from "@mui/icons-material/Done";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { GridActionsCellItem, type GridColDef } from "@mui/x-data-grid";

import { AppDataGrid } from "@/components/data-grid";
import { formatPhone } from "@/lib/br-masks";
import type {
  InboundMessage,
  PaginationMeta,
  ReplyIntent,
} from "../../types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const INTENT_LABELS: Record<ReplyIntent, string> = {
  CONFIRM: "Confirmou",
  CANCEL: "Quer cancelar",
  UNKNOWN: "Precisa ler",
};

const INTENT_COLORS: Record<ReplyIntent, "success" | "warning" | "default"> = {
  CONFIRM: "success",
  CANCEL: "warning",
  UNKNOWN: "default",
};

type InboundTableProps = {
  messages: InboundMessage[];
  meta?: PaginationMeta;
  loading?: boolean;
  onUpdateParams: (updates: Record<string, string | null>) => void;
  onMarkRead: (message: InboundMessage) => void;
  markingId?: string;
};

export const InboundTable = ({
  messages,
  meta,
  loading,
  onUpdateParams,
  onMarkRead,
  markingId,
}: InboundTableProps) => {
  const columns = useMemo<GridColDef<InboundMessage>[]>(
    () => [
      {
        field: "sentAt",
        headerName: "Recebida em",
        width: 130,
        valueFormatter: (value: string) =>
          dateFormatter.format(new Date(value)),
      },
      {
        field: "patient",
        headerName: "Paciente",
        flex: 1.2,
        minWidth: 150,
        // Número fora da base é lead, não erro — dizer "não cadastrado" é
        // mais útil para a recepção do que um traço.
        valueGetter: (_, row) => row.patient?.name ?? "Não cadastrado",
      },
      {
        field: "fromPhone",
        headerName: "Telefone",
        width: 150,
        valueFormatter: (value: string) => formatPhone(value),
      },
      {
        field: "body",
        headerName: "Mensagem",
        flex: 2,
        minWidth: 240,
        renderCell: ({ row }) => (
          <Tooltip
            title={
              <Typography sx={{ whiteSpace: "pre-line" }}>
                {row.body}
              </Typography>
            }
          >
            <Typography
              variant="body2"
              noWrap
              sx={{
                display: "flex",
                alignItems: "center",
                height: "100%",
                fontWeight: row.readAt ? 400 : 600,
              }}
            >
              {row.body}
            </Typography>
          </Tooltip>
        ),
      },
      {
        field: "intent",
        headerName: "Situação",
        width: 140,
        renderCell: ({ row }) => (
          <Chip
            size="small"
            label={INTENT_LABELS[row.intent]}
            color={INTENT_COLORS[row.intent]}
            variant={row.intent === "UNKNOWN" ? "outlined" : "filled"}
          />
        ),
      },
      {
        field: "actions",
        type: "actions",
        headerName: "",
        width: 60,
        getActions: ({ row }) =>
          // Já lida não tem ação: marcar de novo não faz nada, e um item
          // inerte no menu confunde.
          row.readAt
            ? []
            : [
                <GridActionsCellItem
                  key="read"
                  icon={<DoneIcon />}
                  label={
                    markingId === row.id ? "Marcando…" : "Marcar como lida"
                  }
                  onClick={() => onMarkRead(row)}
                  disabled={markingId === row.id}
                  showInMenu
                />,
              ],
      },
    ],
    [onMarkRead, markingId],
  );

  return (
    <AppDataGrid
      rows={messages}
      columns={columns}
      loading={loading}
      paginationMeta={meta}
      onPageChange={(page) => onUpdateParams({ page: String(page) })}
      onPerPageChange={(perPage) =>
        onUpdateParams({ perPage: String(perPage), page: "1" })
      }
      // Não lida em destaque: a caixa existe para separar o que já foi
      // tratado do que ainda espera alguém.
      getRowClassName={({ row }) =>
        row.readAt ? "" : "inbound-row--unread"
      }
      sx={{
        "& .inbound-row--unread": {
          bgcolor: "action.hover",
        },
      }}
    />
  );
};
