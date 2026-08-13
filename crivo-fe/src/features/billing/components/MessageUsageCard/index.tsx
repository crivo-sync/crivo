"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { MessageUsage } from "../../types";

/**
 * "Quanto falta para acabar o plano" — mesmo padrão do card de limite do
 * Snap Financial (`LimitCard`), adaptado para MUI: número grande = o
 * limite, texto pequeno = "usado/limite", barra de progresso, e a cor
 * muda perto do teto. A diferença é que aqui só existe **um** recurso
 * (mensagens/mês), então é um card único, não uma grade.
 */
export const MessageUsageCard = ({ usage }: { usage: MessageUsage }) => {
  const { used, limit, isTrial } = usage;
  const isUnlimited = limit === null;
  const pct = isUnlimited
    ? 0
    : Math.min(100, Math.round((used / limit) * 100));
  const atLimit = limit !== null && used >= limit;

  return (
    <Card
      variant="outlined"
      sx={{
        p: 2.5,
        borderColor: atLimit ? "warning.main" : undefined,
      }}
    >
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "baseline" }}
      >
        <Typography variant="subtitle2" color="text.secondary">
          {isTrial ? "Mensagens no teste" : "Mensagens este mês"}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: atLimit ? "warning.main" : "text.secondary" }}
        >
          {isUnlimited
            ? "sem limite"
            : atLimit
              ? `${used}/${limit} — limite atingido`
              : `${used}/${limit} usadas`}
        </Typography>
      </Stack>

      <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700 }}>
        {isUnlimited ? "∞" : limit}
      </Typography>

      {!isUnlimited && (
        <Box sx={{ mt: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={pct}
            color={atLimit ? "warning" : "primary"}
            sx={{ height: 6, borderRadius: 999 }}
          />
        </Box>
      )}

      {atLimit && (
        <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
          {isTrial
            ? "Novas mensagens não são enviadas até você escolher um plano — elas aparecem na aba Falhas."
            : "Novas mensagens não são enviadas até o mês virar ou você trocar de plano — elas aparecem na aba Falhas."}
        </Typography>
      )}
    </Card>
  );
};
