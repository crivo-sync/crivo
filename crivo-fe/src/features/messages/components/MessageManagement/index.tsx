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
import { MessageFilters } from "../MessageFilters";
import { MessagesTable } from "../MessagesTable";

type TabValue = "history" | "failed";

export const MessageManagement = () => {
  const [tab, setTab] = useState<TabValue>("history");

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
      />
    </Paper>
  );
};
