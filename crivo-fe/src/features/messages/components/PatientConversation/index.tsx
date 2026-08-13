"use client";

import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SendIcon from "@mui/icons-material/Send";

import { ErrorServer } from "@/components/ui/error-server";
import { STATUS_LABELS, TYPE_LABELS } from "../../status";
import { useConversation, useSendManualMessage } from "../../hooks/use-conversation";
import type { ConversationEntry } from "../../types";

const MAX_LENGTH = 2000;

/** "12/08 14:30" — dia e hora bastam numa conversa; o ano polui a bolha. */
const timeLabel = (iso: string) => dayjs(iso).format("DD/MM HH:mm");

/**
 * Legenda da bolha enviada. Mostra o tipo (lembrete, aviso…) porque a mesma
 * conversa mistura automático e manual, e a recepção precisa saber o que o
 * sistema já disse antes de repetir. Falha aparece aqui, não escondida: é o
 * caso em que alguém precisa ligar.
 */
function outboundCaption(entry: ConversationEntry): string {
  const type = entry.type ? TYPE_LABELS[entry.type] : "Mensagem";
  const status = entry.status ? STATUS_LABELS[entry.status] : "";
  return `${type} · ${status} · ${timeLabel(entry.at)}`;
}

const Bubble = ({ entry }: { entry: ConversationEntry }) => {
  const isOut = entry.direction === "OUT";
  const failed = entry.status === "FAILED";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isOut ? "flex-end" : "flex-start",
      }}
    >
      <Box sx={{ maxWidth: "78%" }}>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            borderRadius: 2,
            // Enviada puxa a cor da marca; recebida fica neutra — é o par de
            // cores que o WhatsApp treinou todo mundo a ler sem legenda.
            bgcolor: isOut ? "primary.main" : "background.paper",
            color: isOut ? "primary.contrastText" : "text.primary",
            borderColor: failed ? "error.main" : "divider",
          }}
        >
          {/* `pre-wrap`: os templates têm quebra de linha e emoji, e sem isso
              a mensagem vira um parágrafo só, diferente do que o paciente vê. */}
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {entry.body}
          </Typography>
        </Paper>

        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.5,
            px: 0.5,
            textAlign: isOut ? "right" : "left",
            color: failed ? "error.main" : "text.secondary",
          }}
        >
          {isOut ? outboundCaption(entry) : `Paciente · ${timeLabel(entry.at)}`}
        </Typography>

        {failed && entry.lastError && (
          <Typography
            variant="caption"
            sx={{ display: "block", px: 0.5, color: "error.main" }}
          >
            Não entregue — ligue para o paciente.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

/**
 * Conversa com o paciente: envio e recebimento na mesma linha do tempo, com
 * campo de resposta.
 *
 * Existe porque a caixa de entrada só permitia LER — para responder, a
 * recepção abria o WhatsApp por fora do sistema, e aquela resposta não ficava
 * registrada em lugar nenhum.
 */
export const PatientConversation = ({ patientId }: { patientId: string }) => {
  const { entries, isLoading, error, refetch } = useConversation(patientId);
  const sendMessage = useSendManualMessage(patientId);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // Rola para a mensagem mais recente, como qualquer app de conversa. Sem
  // isso a tela abre no topo, no lembrete mais antigo.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [entries.length]);

  if (error) {
    return <ErrorServer message={error.message} onRetry={() => refetch()} />;
  }

  const trimmed = draft.trim();
  const canSend = trimmed.length > 0 && !sendMessage.isPending;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSend) return;

    sendMessage.mutate(trimmed, {
      // Só limpa o campo se o envio foi aceito — em erro, o texto continua
      // ali para a recepção tentar de novo sem redigitar.
      onSuccess: () => setDraft(""),
    });
  };

  return (
    <Stack spacing={2} sx={{ py: 1 }}>
      <Box
        sx={{
          maxHeight: 420,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          pr: 1,
        }}
      >
        {isLoading ? (
          <Stack spacing={1.5} aria-busy>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} variant="rounded" height={60} />
            ))}
          </Stack>
        ) : entries.length === 0 ? (
          <Alert severity="info">
            Nenhuma mensagem trocada com este paciente ainda.
          </Alert>
        ) : (
          entries.map((entry) => <Bubble key={entry.id} entry={entry} />)
        )}
        <div ref={endRef} />
      </Box>

      <Stack component="form" onSubmit={handleSubmit} spacing={1}>
        <TextField
          label="Responder pelo WhatsApp"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Escreva a resposta para o paciente…"
          multiline
          rows={3}
          fullWidth
          slotProps={{ htmlInput: { maxLength: MAX_LENGTH } }}
          helperText={`${draft.length}/${MAX_LENGTH}`}
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="submit"
            variant="contained"
            disabled={!canSend}
            startIcon={
              sendMessage.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SendIcon />
              )
            }
          >
            {sendMessage.isPending ? "Enviando…" : "Enviar"}
          </Button>
        </Box>
      </Stack>
    </Stack>
  );
};
