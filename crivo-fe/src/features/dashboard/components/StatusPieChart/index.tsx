"use client";

import { PieChart } from "@mui/x-charts/PieChart";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";

import { STATUS_LABELS } from "@/features/appointments/status";
import type { DashboardStatusCount } from "../../types";

// Hex reais para o gráfico — STATUS_COLORS de appointments/status.ts usa
// nomes semânticos do MUI (default/info/...), que servem pra <Chip
// color="...">, não pra série de um PieChart (que precisa de hex).
const STATUS_HEX_COLORS: Record<DashboardStatusCount["status"], string> = {
  SCHEDULED: "#9e9e9e",
  CONFIRMED: "#0288d1",
  COMPLETED: "#2e7d32",
  CANCELLED: "#d32f2f",
  NO_SHOW: "#ed6c02",
};

type StatusPieChartProps = {
  data: DashboardStatusCount[];
};

export const StatusPieChart = ({ data }: StatusPieChartProps) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const series = data
    .filter((item) => item.count > 0)
    .map((item) => ({
      id: item.status,
      label: STATUS_LABELS[item.status],
      value: item.count,
      color: STATUS_HEX_COLORS[item.status],
    }));

  return (
    <Card variant="outlined">
      <CardHeader
        title="Status dos agendamentos"
        subheader="Últimos 7 dias"
      />
      {total === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary", px: 2, pb: 3 }}>
          Nenhum agendamento no período.
        </Typography>
      ) : (
        <PieChart
          series={[{ data: series, innerRadius: 40, paddingAngle: 2 }]}
          height={260}
          slotProps={{ legend: { direction: "vertical" } }}
        />
      )}
    </Card>
  );
};
