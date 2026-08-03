"use client";

import { BarChart } from "@mui/x-charts/BarChart";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";

import { formatCentsToBRL } from "@/lib/currency";
import type { DashboardProcedureRevenue } from "../../types";

type RevenueByProcedureChartProps = {
  data: DashboardProcedureRevenue[];
};

export const RevenueByProcedureChart = ({ data }: RevenueByProcedureChartProps) => {
  return (
    <Card variant="outlined">
      <CardHeader
        title="Faturamento por procedimento"
        subheader="Últimos 7 dias · só concluídos"
      />
      {data.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary", px: 2, pb: 3 }}>
          Nenhum procedimento concluído no período.
        </Typography>
      ) : (
        <BarChart
          layout="horizontal"
          yAxis={[{ data: data.map((item) => item.name), scaleType: "band" }]}
          series={[
            {
              data: data.map((item) => item.totalInCents / 100),
              label: "Faturamento",
              color: "#22d3ee",
              valueFormatter: (value) =>
                value === null ? "" : formatCentsToBRL(Math.round(value * 100)),
            },
          ]}
          height={Math.max(200, data.length * 48)}
        />
      )}
    </Card>
  );
};
