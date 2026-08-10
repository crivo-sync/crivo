"use client";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { formatPhone } from "@/lib/br-masks";
import { toFriendlyError } from "../../error-messages";
import { CHANNEL_LABELS, STATUS_COLORS, STATUS_LABELS, TYPE_LABELS } from "../../status";
import type { Message } from "../../types";

type ViewMessageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: Message;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const formatDate = (value?: string | null) =>
  value ? dateFormatter.format(new Date(value)) : "—";

/** Rótulo + valor, no formato de leitura usado no resto do painel. */
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Box>
    <Typography variant="caption" sx={{ color: "text.secondary" }}>
      {label}
    </Typography>
    <Typography variant="body2">{children}</Typography>
  </Box>
);

/**
 * Corpo completo da mensagem enviada.
 *
 * A coluna da tabela trunca com reticências, e o texto do WhatsApp tem emoji,
 * quebras de linha reais e o link de confirmação — nada disso é legível num
 * tooltip de uma linha. Quando a recepção liga para o paciente que não
 * recebeu, ela precisa saber exatamente o que ele deveria ter lido.
 */
export const ViewMessageDialog = ({
  open,
  onOpenChange,
  message,
}: ViewMessageDialogProps) => {
  if (!message) return null;

  // Depois do early return de propósito: `toFriendlyError` é função pura, não
  // hook — não há ordem de hooks a preservar aqui.
  const friendlyError = toFriendlyError(message.lastError);

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Mensagem enviada</DialogTitle>

      <DialogContent>
        <Stack spacing={2.5}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Field label="Paciente">
              {message.appointment?.patient.name ?? "—"}
            </Field>
            <Field label="Telefone">{formatPhone(message.toPhone)}</Field>
            <Field label="Tipo">{TYPE_LABELS[message.type]}</Field>
            <Field label="Canal">{CHANNEL_LABELS[message.channel]}</Field>
            <Field label="Criada em">{formatDate(message.createdAt)}</Field>
            <Field label="Tentativas">{message.attempts}</Field>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Status
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                size="small"
                label={STATUS_LABELS[message.status]}
                color={STATUS_COLORS[message.status]}
                variant={message.status === "PENDING" ? "outlined" : "filled"}
              />
            </Box>
          </Box>

          <Box>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
            >
              Texto enviado
            </Typography>
            {/* `pre-line` preserva as quebras que o template gera — sem isso
                o texto vira um parágrafo único e some a formatação que o
                paciente de fato recebe no WhatsApp. */}
            <Typography
              variant="body2"
              sx={{
                whiteSpace: "pre-line",
                p: 1.5,
                borderRadius: 1,
                bgcolor: "action.hover",
                wordBreak: "break-word",
              }}
            >
              {message.body}
            </Typography>
          </Box>

          {message.status === "FAILED" && (
            <Alert severity="error">
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {friendlyError.title}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {friendlyError.hint}
              </Typography>
              <Typography
                variant="caption"
                sx={{ display: "block", mt: 1, opacity: 0.8 }}
              >
                Falhou em {formatDate(message.failedAt)}
              </Typography>

              {/* O texto cru fica atrás de um clique: é o que o suporte pede
                  quando a recepção liga, mas mostrá-lo de cara foi o que
                  tornou a tela ilegível para quem só quer saber o que fazer. */}
              {message.lastError && (
                <Accordion
                  disableGutters
                  elevation={0}
                  sx={{ mt: 1, bgcolor: "transparent", "&::before": { display: "none" } }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon fontSize="small" />}
                    sx={{ px: 0, minHeight: 0 }}
                  >
                    <Typography variant="caption">Detalhe técnico</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0, pt: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        fontFamily: "monospace",
                        wordBreak: "break-word",
                      }}
                    >
                      {message.lastError}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              )}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button type="button" color="inherit" onClick={() => onOpenChange(false)}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
