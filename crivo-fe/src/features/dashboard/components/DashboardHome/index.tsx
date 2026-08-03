"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

import { ErrorServer } from "@/components/ui/error-server";
import { useDashboardAnalytics } from "../../hooks/use-dashboard-analytics";
import { useDashboardSummary } from "../../hooks/use-dashboard-summary";
import { AppointmentsByDayChart } from "../AppointmentsByDayChart";
import { AppointmentsList } from "../AppointmentsList";
import { FailedMessagesAlert } from "../FailedMessagesAlert";
import { RevenueByProcedureChart } from "../RevenueByProcedureChart";
import { StatusPieChart } from "../StatusPieChart";
import { SummaryCards } from "../SummaryCards";

export const DashboardHome = () => {
  const { summary, isLoading, error, refetch } = useDashboardSummary();
  const { analytics, isLoading: isLoadingAnalytics } = useDashboardAnalytics();

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
        {isLoadingAnalytics || !analytics ? (
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

      {!isLoadingAnalytics && analytics && (
        <RevenueByProcedureChart data={analytics.revenueByProcedure} />
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
