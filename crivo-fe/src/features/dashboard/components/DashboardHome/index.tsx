"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import { ErrorServer } from "@/components/ui/error-server";
import { useDashboardAnalytics } from "../../hooks/use-dashboard-analytics";
import { useDashboardSummary } from "../../hooks/use-dashboard-summary";
import { usePlanFeatures } from "@/features/tenant/hooks/use-plan-features";
import { UpgradeChartsCard } from "./upgrade-charts-card";
import { AppointmentsByDayChart } from "../AppointmentsByDayChart";
import { AppointmentsList } from "../AppointmentsList";
import { FailedMessagesAlert } from "../FailedMessagesAlert";
import { RevenueByProcedureChart } from "../RevenueByProcedureChart";
import { StatusPieChart } from "../StatusPieChart";
import { SummaryCards } from "../SummaryCards";

/** Default alinhado ao backend — ver `DEFAULT_REVENUE_WINDOW_DAYS` no crivo-be. */
const DEFAULT_REVENUE_DAYS = 30;

export const DashboardHome = () => {
  const [revenueDays, setRevenueDays] = useState<number>(DEFAULT_REVENUE_DAYS);
  const { summary, isLoading, error, refetch } = useDashboardSummary();

  // Gráficos são feature de plano; o resumo do dia não. Sem essa distinção a
  // clínica no Solo/Básico via a home inteira virar erro.
  const { has, planName } = usePlanFeatures();
  const canCharts = has("hasDashboard");
  const {
    analytics,
    isLoading: isLoadingAnalytics,
    isFetching: isFetchingAnalytics,
  } = useDashboardAnalytics(revenueDays, canCharts);

  if (error) {
    return <ErrorServer message={error.message} onRetry={() => refetch()} />;
  }

  if (isLoading || !summary) {
    return (
      <Stack spacing={3}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 2,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={84} />
          ))}
        </Box>
        <Skeleton variant="rounded" height={180} />
        <Skeleton variant="rounded" height={180} />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <SummaryCards counts={summary.counts} />

      <FailedMessagesAlert messages={summary.failedMessages} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
        }}
      >
        {!canCharts ? (
          <UpgradeChartsCard planName={planName} />
        ) : isLoadingAnalytics || !analytics ? (
          <>
            <Skeleton variant="rounded" height={260} />
            <Skeleton variant="rounded" height={260} />
          </>
        ) : (
          <>
            <AppointmentsByDayChart data={analytics.byDay} />
            <StatusPieChart data={analytics.byStatus} />
          </>
        )}
      </Box>

      {canCharts && !isLoadingAnalytics && analytics && (
        <RevenueByProcedureChart
          data={analytics.revenueByProcedure}
          // A janela vem da resposta, não do estado local: é o backend que
          // decide o default, então o seletor reflete o que foi de fato
          // aplicado em vez de assumir.
          periodDays={analytics.revenueDays}
          onPeriodChange={setRevenueDays}
          isRefreshing={isFetchingAnalytics}
        />
      )}

      <Card variant="outlined">
        <CardHeader
          title="Agendamentos de hoje"
          subheader={
            summary.counts.appointmentsToday > 0
              ? `${summary.counts.appointmentsToday} no total`
              : undefined
          }
        />
        <Box sx={{ px: 2, pb: 2 }}>
          <AppointmentsList
            appointments={summary.appointmentsToday}
            emptyMessage="Nenhum agendamento para hoje."
          />
        </Box>
      </Card>

      <Card variant="outlined">
        <CardHeader
          title="A confirmar (próximas 48h)"
          subheader={
            summary.counts.upcomingUnconfirmed > 0
              ? `${summary.counts.upcomingUnconfirmed} aguardando confirmação`
              : undefined
          }
        />
        <Box sx={{ px: 2, pb: 2 }}>
          <AppointmentsList
            appointments={summary.upcomingUnconfirmed}
            emptyMessage="Nenhum agendamento aguardando confirmação."
          />
        </Box>
      </Card>
    </Stack>
  );
};
