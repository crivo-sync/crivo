"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";

import { ErrorServer } from "@/components/ui/error-server";
import { useUpcomingRisk } from "../../hooks/use-upcoming-risk";
import type { AppointmentRisk, RiskLevel } from "../../types";

const LEVEL_LABELS: Record<RiskLevel, string> = {
  HIGH: "Risco alto",
  MEDIUM: "Risco médio",
  LOW: "Risco baixo",
};

const LEVEL_COLORS: Record<RiskLevel, "error" | "warning" | "success"> = {
  HIGH: "error",
  MEDIUM: "warning",
  LOW: "success",
};

const RiskCard = ({ risk }: { risk: AppointmentRisk }) => (
  <Card variant="outlined" sx={{ p: 2 }}>
    <Stack spacing={1.5}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {risk.patientName}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {dayjs(risk.startsAt).format("DD/MM [às] HH:mm")}
          </Typography>
        </Box>

        <Chip
          size="small"
          label={LEVEL_LABELS[risk.level]}
          color={LEVEL_COLORS[risk.level]}
          variant={risk.level === "LOW" ? "outlined" : "filled"}
        />
      </Box>

      {/* Os motivos são o ponto: "risco alto" sozinho é um número que a
          recepção não tem como checar nem discordar. */}
      {risk.factors.length > 0 && (
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {risk.factors.map((factor) => (
            <Chip
              key={factor.code}
              size="small"
              variant="outlined"
              label={factor.label}
              // Fator que reduz o risco (histórico bom) não pode parecer
              // um alerta.
              color={factor.points < 0 ? "success" : "default"}
            />
          ))}
        </Box>
      )}
    </Stack>
  </Card>
);

/**
 * Quem tem mais chance de faltar, primeiro.
 *
 * Responde "para quem eu ligo hoje?" — por isso ordena por risco e não por
 * horário: a recepção tem tempo limitado e precisa começar por quem importa.
 */
export const NoShowRiskList = () => {
  const [days, setDays] = useState(7);
  const { risks, summary, isLoading, error, refetch } = useUpcomingRisk({
    days,
  });

  if (error) {
    return <ErrorServer message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Stack direction="row" spacing={1}>
          <Chip
            size="small"
            color="error"
            label={`${summary.high} alto`}
            variant={summary.high > 0 ? "filled" : "outlined"}
          />
          <Chip size="small" color="warning" variant="outlined" label={`${summary.medium} médio`} />
          <Chip size="small" color="success" variant="outlined" label={`${summary.low} baixo`} />
        </Stack>

        <TextField
          select
          size="small"
          label="Período"
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value={7}>Próximos 7 dias</MenuItem>
          <MenuItem value={15}>Próximos 15 dias</MenuItem>
          <MenuItem value={30}>Próximos 30 dias</MenuItem>
        </TextField>
      </Box>

      {isLoading ? (
        <Stack spacing={1.5}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={110} />
          ))}
        </Stack>
      ) : risks.length === 0 ? (
        <Alert severity="info">
          Nenhum agendamento no período. Nada a acompanhar por enquanto.
        </Alert>
      ) : (
        <>
          {summary.high > 0 && (
            <Alert severity="warning">
              {summary.high === 1
                ? "1 paciente com risco alto de faltar — vale uma ligação."
                : `${summary.high} pacientes com risco alto de faltar — vale uma ligação.`}{" "}
              Eles já recebem lembrete extra automaticamente.
            </Alert>
          )}

          <Stack spacing={1.5}>
            {risks.map((risk) => (
              <RiskCard key={risk.appointmentId} risk={risk} />
            ))}
          </Stack>
        </>
      )}
    </Stack>
  );
};
