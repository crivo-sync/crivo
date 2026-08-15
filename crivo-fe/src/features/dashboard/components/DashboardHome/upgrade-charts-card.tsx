"use client";

import Link from "next/link";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import InsightsIcon from "@mui/icons-material/Insights";

/**
 * Ocupa o lugar dos gráficos quando o plano não os inclui.
 *
 * Antes, a tela inteira do painel virava um erro vermelho — a clínica no
 * Solo abria o sistema e a primeira coisa que via era o produto parecendo
 * quebrado. Agora o resumo do dia (que é operação, não análise) carrega
 * normal, e só o bloco de gráficos vira este convite.
 */
export const UpgradeChartsCard = ({ planName }: { planName: string | null }) => (
  <Card
    variant="outlined"
    sx={{
      p: 3,
      gridColumn: { xs: "auto", md: "1 / -1" },
      display: "flex",
      flexDirection: { xs: "column", sm: "row" },
      alignItems: { xs: "flex-start", sm: "center" },
      gap: 2,
      borderStyle: "dashed",
    }}
  >
    <InsightsIcon sx={{ fontSize: 36, color: "text.disabled" }} />

    <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Gráficos e faturamento
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Veja agendamentos por dia, status e quanto cada procedimento rendeu.
        {planName
          ? ` Disponível a partir do plano Intermediário — o ${planName} não inclui.`
          : ""}
      </Typography>
    </Stack>

    <Button
      component={Link}
      href="/painel/configuracoes"
      variant="outlined"
      sx={{ flexShrink: 0 }}
    >
      Ver planos
    </Button>
  </Card>
);
