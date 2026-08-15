import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { planFeatureLines } from "../../plan-features";
import type { Plan } from "../../types";

const centsToBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

type PlanCardProps = {
  plan: Plan;
  isCurrent: boolean;
  isLoading: boolean;
  /** `false` quando o usuário logado não é ADMIN — o botão fica desabilitado. */
  canSelect: boolean;
  /**
   * Mais barato que o plano atual. Muda o texto do botão para dizer o que
   * vai acontecer — não desabilita: descer de plano é direito do cliente, e
   * um botão morto o obrigaria a procurar suporte para economizar.
   */
  isDowngrade?: boolean;
  onSelect: (planId: string) => void;
};

export const PlanCard = ({
  plan,
  isCurrent,
  isLoading,
  canSelect,
  isDowngrade = false,
  onSelect,
}: PlanCardProps) => {
  return (
    <Card
      variant="outlined"
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        borderColor: isCurrent ? "primary.main" : undefined,
        borderWidth: isCurrent ? 2 : 1,
      }}
    >
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {plan.name}
        </Typography>
        {isCurrent && <Chip label="Plano atual" color="primary" size="small" />}
      </Stack>

      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {centsToBRL(plan.priceInCents)}
        <Typography component="span" variant="body2" color="text.secondary">
          {" "}
          /mês
        </Typography>
      </Typography>

      {/* Itens não inclusos ficam na lista, apagados — some-los deixaria o
          plano mais barato com uma coluna quase vazia, sem dizer o que a
          clínica perde ao escolhê-lo. */}
      <List dense disablePadding>
        {planFeatureLines(plan).map((line) => (
          <ListItem key={line.text} disableGutters disablePadding>
            <ListItemIcon sx={{ minWidth: 28 }}>
              {line.included ? (
                <CheckIcon fontSize="small" color="success" />
              ) : (
                <CloseIcon fontSize="small" sx={{ color: "text.disabled" }} />
              )}
            </ListItemIcon>
            <ListItemText
              primary={line.text}
              slotProps={{
                primary: {
                  sx: line.included
                    ? undefined
                    : { color: "text.disabled", textDecoration: "line-through" },
                },
              }}
            />
          </ListItem>
        ))}
      </List>

      <Button
        // Downgrade sai do azul cheio: o botão principal da tela deve ser o
        // que faz a clínica subir de plano, não o que a faz descer.
        variant={isCurrent || isDowngrade ? "outlined" : "contained"}
        color={isDowngrade ? "inherit" : "primary"}
        disabled={isCurrent || isLoading || !canSelect}
        startIcon={
          isLoading ? (
            <CircularProgress size={16} color="inherit" />
          ) : isCurrent ? (
            <CircleOutlinedIcon fontSize="small" />
          ) : null
        }
        onClick={() => onSelect(plan.id)}
        fullWidth
      >
        {isCurrent
          ? "Plano contratado"
          : isDowngrade
            ? "Mudar para este plano"
            : "Assinar este plano"}
      </Button>

      {/* O texto do botão sozinho não diz que o acesso continua até o fim do
          ciclo já pago — e é justamente essa a dúvida de quem hesita em
          descer de plano. */}
      {isDowngrade && !isCurrent && (
        <Typography
          variant="caption"
          sx={{ mt: -1, textAlign: "center", color: "text.secondary" }}
        >
          Você mantém os recursos atuais até o fim do período já pago.
        </Typography>
      )}
    </Card>
  );
};
