"use client";

import { BarChart } from "@mui/x-charts/BarChart";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";

import type { DashboardDayCount } from "../../types";

const dayLabelFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
});

type AppointmentsByDayChartProps = {
  data: DashboardDayCount[];
};

export const AppointmentsByDayChart = ({ data }: AppointmentsByDayChartProps) => {
  const labels = data.map((item) => dayLabelFormatter.format(new Date(`${item.date}T00:00:00`)));
  const counts = data.map((item) => item.count);

  return (
    <Card variant="outlined">
      <CardHeader title="Agendamentos por dia" subheader="Últimos 7 dias" />
      <BarChart
        xAxis={[{ data: labels, scaleType: "band" }]}
        series={[{ data: counts, label: "Agendamentos", color: "#4f46e5" }]}
        height={260}
      />
    </Card>
  );
};
