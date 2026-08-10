"use client";

import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import { GridActionsCellItem, type GridColDef } from "@mui/x-data-grid";

import { formatPhone } from "@/lib/br-masks";
import { toFriendlyError } from "../../error-messages";
import {
  CHANNEL_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  TYPE_LABELS,
} from "../../status";
import type { Message } from "../../types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

type BuildColumnsOptions = {
  /**
   * Presente só na aba de falhas: histórico é registro, não fila de ação —
   * uma coluna de botão ali sugeriria reenviar mensagem já entregue.
   */
  onResend?: (message: Message) => void;
  /** Abre o corpo completo da mensagem, que a coluna trunca. */
  onView?: (message: Message) => void;
  resendingId?: string;
};

export function buildMessageColumns({
  onResend,
  onView,
  resendingId,
}: BuildColumnsOptions = {}): GridColDef<Message>[] {
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
      minWidth: 160,
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
      width: 100,
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
    // A coluna "Mensagem" saiu daqui: truncada com reticências ela não
    // servia para ler o texto, e o corpo completo (com emoji, quebras de
    // linha e o link de confirmação) agora abre em "Ver mensagem".
    {
      field: "attempts",
      headerName: "Tentativas",
      width: 100,
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      // O tooltip mostra o motivo em português; o texto cru do provider fica
      // em "Ver mensagem" → Detalhe técnico.
      renderCell: ({ row }) => (
        <Tooltip
          title={
            row.status === "FAILED" ? toFriendlyError(row.lastError).title : ""
          }
        >
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
    ...(onView || onResend
      ? ([
          {
            field: "actions",
            type: "actions",
            headerName: "",
            // Menu de três pontos, igual às demais tabelas do painel: um
            // botão com rótulo ocupava largura fixa e ficava cortado na
            // borda direita, já que esta tabela tem muitas colunas.
            width: 60,
            getActions: ({ row }) => [
              // As duas ações são independentes: o histórico recebe só a
              // leitura, e a aba de falhas recebe as duas.
              ...(onView
                ? [
                    <GridActionsCellItem
                      key="view"
                      icon={<VisibilityOutlinedIcon />}
                      label="Ver mensagem"
                      // Leitura: a coluna trunca o texto, e o corpo do
                      // WhatsApp tem emoji, quebras de linha e o link de
                      // confirmação. Não depende do envio, então continua
                      // ativo durante o reenvio.
                      onClick={() => onView(row)}
                      showInMenu
                    />,
                  ]
                : []),
              ...(onResend
                ? [
                    <GridActionsCellItem
                      key="resend"
                      icon={<RefreshIcon />}
                      label={
                        resendingId === row.id
                          ? "Enviando…"
                          : "Reenviar mensagem"
                      }
                      onClick={() => onResend(row)}
                      // Só a linha em envio trava: bloquear a tabela inteira
                      // impediria a recepção de disparar as outras falhas em
                      // sequência, que é o que ela faz nesta tela.
                      disabled={resendingId === row.id}
                      showInMenu
                    />,
                  ]
                : []),
            ],
          },
        ] satisfies GridColDef<Message>[])
      : []),
  ];
}
