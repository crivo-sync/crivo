"use client";

import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

import { formatCentsToBRL } from "@/lib/currency";
import { useNoShowCost } from "../../hooks/use-no-show-cost";

/**
 * Quanto a falta custou este mês, em reais.
 *
 * O produto media no-show em contagem e percentual — linguagem de produto.
 * **Dono de clínica pensa em dinheiro**, e o dado já existia
 * (`priceInCents` congelado no ato): somar os `NO_SHOW` do mês responde
 * "quanto isso te custou".
 *
 * O que este card **não** diz é "R$ X recuperados pela lista de espera",
 * que seria o número mais vendável: hoje a oferta de vaga não registra se
 * virou agendamento, e afirmar isso seria inventar. O que aparece é
 * "faltas evitadas" — paciente que confirmou pelo WhatsApp e compareceu.
 */
export const NoShowCostCard = () => {
  const { cost, isLoading } = useNoShowCost();

  if (isLoading) return <Skeleton variant="rounded" height={104} />;
  if (!cost) return null;

  // Mês sem nenhuma falta é notícia boa — e um card vermelho zerado passaria
  // a impressão oposta.
  const semFaltas = cost.noShowCount === 0;

  return (
    <Card
      variant="outlined"
      sx={{
        p: 2.5,
        borderColor: semFaltas ? "success.light" : "warning.light",
        bgcolor: semFaltas ? "success.50" : "warning.50",
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center", flexWrap: "wrap" }}
      >
        <TrendingDownIcon
          sx={{
            fontSize: 32,
            color: semFaltas ? "success.main" : "warning.main",
          }}
        />

        <Stack sx={{ flexGrow: 1, minWidth: 220 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {semFaltas
              ? "Nenhuma falta este mês"
              : "As faltas custaram este mês"}
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {formatCentsToBRL(cost.lostInCents)}
          </Typography>

          {!semFaltas && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {cost.noShowCount}{" "}
              {cost.noShowCount === 1 ? "paciente faltou" : "pacientes faltaram"}
              {/* Só mostra a taxa quando há desfecho suficiente para ela
                  significar algo: "100%" com um único atendimento é ruído. */}
              {cost.noShowRate !== null && cost.finishedCount >= 5
                ? ` — ${Math.round(cost.noShowRate * 100)}% dos atendimentos`
                : ""}
            </Typography>
          )}
        </Stack>

        {cost.savedCount > 0 && (
          <Chip
            label={`${cost.savedCount} ${
              cost.savedCount === 1 ? "falta evitada" : "faltas evitadas"
            } · ${formatCentsToBRL(cost.savedInCents)}`}
            color="success"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Stack>
    </Card>
  );
};
