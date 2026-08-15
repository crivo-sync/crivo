"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";

import type { Plan } from "../../types";

type ConfirmDowngradeDialogProps = {
  /** `undefined` fecha o dialog. */
  targetPlan?: Plan;
  currentPlan?: Plan;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Confirmação antes de descer de plano.
 *
 * Descer é direito do cliente e continua a um clique de distância — o que
 * este dialog evita é o clique **acidental**: os cards ficam lado a lado, e
 * "Assinar este plano" no Solo parecia tão inofensivo quanto no Avançado.
 *
 * Lista o que se perde de verdade, comparando as features dos dois planos.
 * Um "tem certeza?" genérico não ajuda ninguém a decidir.
 */
export const ConfirmDowngradeDialog = ({
  targetPlan,
  currentPlan,
  isLoading,
  onCancel,
  onConfirm,
}: ConfirmDowngradeDialogProps) => {
  if (!targetPlan) return null;

  const perdas: string[] = [];

  if (currentPlan) {
    if (currentPlan.hasPrediction && !targetPlan.hasPrediction)
      perdas.push("Predição de risco de no-show");
    if (currentPlan.hasWaitlist && !targetPlan.hasWaitlist)
      perdas.push("Lista de espera com aviso automático");
    if (currentPlan.hasMedicalRecords && !targetPlan.hasMedicalRecords) {
      perdas.push("Prontuário (anamnese e evolução)");
      // Item separado de propósito: quem tem foto guardada precisa ver que
      // vai perder acesso a ela, não deduzir isso de "prontuário".
      perdas.push("Fotos antes/depois (as já enviadas ficam inacessíveis)");
    }
    if (currentPlan.hasAiMessages && !targetPlan.hasAiMessages)
      perdas.push("Mensagens reescritas por IA");
    if (currentPlan.hasDashboard && !targetPlan.hasDashboard)
      perdas.push("Painel com gráficos e faturamento");

    const antes = currentPlan.maxProfessionals;
    const depois = targetPlan.maxProfessionals;
    if (antes === null && depois !== null) {
      perdas.push(`Profissionais ilimitados (passa a ter até ${depois})`);
    } else if (antes !== null && depois !== null && depois < antes) {
      perdas.push(`Limite de profissionais cai de ${antes} para ${depois}`);
    }
  }

  return (
    <Dialog open onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Mudar para o plano {targetPlan.name}?</DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ mb: perdas.length ? 1 : 0 }}>
          Você mantém os recursos atuais até o fim do período já pago. Depois
          disso, deixa de ter:
        </Typography>

        {perdas.length > 0 && (
          <List dense disablePadding>
            {perdas.map((item) => (
              <ListItem key={item} disableGutters sx={{ py: 0.25 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <CloseIcon fontSize="small" color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary={item}
                  slotProps={{ primary: { variant: "body2" } }}
                />
              </ListItem>
            ))}
          </List>
        )}

        {/* Profissional cadastrado além do limite novo é o caso que mais dói:
            a clínica descobre ao tentar usar, não ao trocar de plano. */}
        {targetPlan.maxProfessionals !== null && (
          <Typography
            variant="caption"
            sx={{ mt: 1.5, display: "block", color: "text.secondary" }}
          >
            Se a clínica tiver mais profissionais que o novo limite, será
            preciso desativar os excedentes antes de cadastrar outros.
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} color="inherit" disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} variant="contained" disabled={isLoading}>
          {isLoading ? "Alterando…" : "Confirmar mudança"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
