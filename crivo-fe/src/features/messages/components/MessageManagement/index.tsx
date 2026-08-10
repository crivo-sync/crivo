"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import { ErrorServer } from "@/components/ui/error-server";

import { useFailedMessages } from "../../hooks/use-failed-messages";
import { useMessagesFiltersState } from "../../hooks/use-messages-filters-state";
import { useMessages } from "../../hooks/use-messages";
import { useResendMessage } from "../../hooks/use-resend-message";
import { MessageFilters } from "../MessageFilters";
import { MessagesTable } from "../MessagesTable";
import { ViewMessageDialog } from "../ViewMessageDialog";
import type { Message } from "../../types";

type TabValue = "history" | "failed";

export const MessageManagement = () => {
  const [tab, setTab] = useState<TabValue>("history");
  const [viewingMessage, setViewingMessage] = useState<Message | undefined>();

  const { page, perPage, status, from, to, updateParams, clearFilters } =
    useMessagesFiltersState();
  const history = useMessages({
    page,
    perPage,
    status: status || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const failed = useFailedMessages({ page: 1, perPage: 50 });
  const resend = useResendMessage();

  const active = tab === "history" ? history : failed;

  if (active.error) {
    return (
      <ErrorServer
        message={active.error.message}
        onRetry={() => active.refetch()}
      />
    );
  }

  return (
    <Paper
      elevation={1}
      sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab label="Histórico" value="history" />
          <Tab
            value="failed"
            label={
              <Badge
                badgeContent={failed.meta?.total ?? 0}
                color="error"
                sx={{ pr: failed.meta?.total ? 1.5 : 0 }}
              >
                Falhas — ligar para o paciente
              </Badge>
            }
          />
        </Tabs>
      </Box>

      {tab === "history" && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <MessageFilters
            status={status}
            from={from}
            to={to}
            onChange={updateParams}
            onClear={clearFilters}
          />
        </Box>
      )}

      {tab === "failed" && (failed.meta?.total ?? 0) === 0 && !failed.isLoading && (
        <Alert severity="success">
          Nenhuma mensagem falhou. Todos os pacientes foram avisados.
        </Alert>
      )}

      <MessagesTable
        messages={active.messages}
        meta={active.meta}
        loading={active.isLoading}
        onUpdateParams={tab === "history" ? updateParams : () => {}}
        // Só na aba de falhas: no histórico há mensagens já entregues, e um
        // botão de reenvio ali convidaria a duplicar aviso no WhatsApp do
        // paciente. `.mutate` (não `mutateAsync`) porque não há nada a
        // aguardar antes de seguir — o snackbar do hook cobre erro e sucesso.
        onResend={
          tab === "failed" ? (message) => resend.mutate(message.id) : undefined
        }
        // Leitura vale nas duas abas: a coluna trunca o texto em qualquer uma.
        onView={setViewingMessage}
        resendingId={resend.isPending ? resend.variables : undefined}
      />

      <ViewMessageDialog
        open={!!viewingMessage}
        onOpenChange={(open) => !open && setViewingMessage(undefined)}
        message={viewingMessage}
      />
    </Paper>
  );
};
