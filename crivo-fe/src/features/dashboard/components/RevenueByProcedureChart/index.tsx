"use client";

import { BarChart } from "@mui/x-charts/BarChart";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { formatCentsToBRL } from "@/lib/currency";
import {
  REVENUE_PERIOD_OPTIONS,
  type DashboardProcedureRevenue,
} from "../../types";

type RevenueByProcedureChartProps = {
  data: DashboardProcedureRevenue[];
  periodDays: number;
  onPeriodChange: (days: number) => void;
  /** Trocando de período: mantém o gráfico antigo, mas esmaecido. */
  isRefreshing?: boolean;
};

const PERIOD_LABELS: Record<number, string> = {
  7: "Últimos 7 dias",
  30: "Últimos 30 dias",
  90: "Últimos 90 dias",
};

export const RevenueByProcedureChart = ({
  data,
  periodDays,
  onPeriodChange,
  isRefreshing = false,
}: RevenueByProcedureChartProps) => {
  const total = data.reduce((sum, item) => sum + item.totalInCents, 0);

  return (
    <Card
      variant="outlined"
      sx={{
        opacity: isRefreshing ? 0.6 : 1,
        transition: "opacity 0.2s",
      }}
    >
      <CardHeader
        title="Faturamento por procedimento"
        subheader={
          data.length > 0
            ? `${formatCentsToBRL(total)} no total · só concluídos`
            : "Só agendamentos concluídos"
        }
        action={
          <TextField
            select
            size="small"
            value={periodDays}
            onChange={(event) => onPeriodChange(Number(event.target.value))}
            sx={{ minWidth: 170 }}
          >
            {REVENUE_PERIOD_OPTIONS.map((days) => (
              <MenuItem key={days} value={days}>
                {PERIOD_LABELS[days]}
              </MenuItem>
            ))}
          </TextField>
        }
      />
      {data.length === 0 ? (
        <Box sx={{ px: 2, pb: 3 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Nenhum procedimento concluído neste período. Tente um intervalo
            maior.
          </Typography>
        </Box>
      ) : (
        <BarChart
          layout="horizontal"
          // `margin` sozinho não resolve: o MUI X trunca o rótulo pela largura
          // reservada ao tick, não pela margem do gráfico. "Limpeza dental"
          // virava "Limp..." — justamente o texto que dá sentido à barra.
          margin={{ left: 190 }}
          yAxis={[
            {
              data: data.map((item) => item.name),
              scaleType: "band",
              width: 180,
            },
          ]}
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
