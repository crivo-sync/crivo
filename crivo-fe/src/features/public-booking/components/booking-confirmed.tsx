"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { formatPhone } from "@/lib/br-masks";
import type { BookingClinic, BookingConfirmation } from "../types";

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Quanto tempo esperamos que a mensagem de confirmação leve para chegar no
 * WhatsApp do paciente. Não é um palpite solto: o envio passa por uma fila
 * (BullMQ) e é o tempo em que, na prática, a mensagem sai — quando o
 * provider está de pé.
 */
const WHATSAPP_WAIT_SECONDS = 20;
const TICK_MS = 250;

/**
 * Tela do paciente logo depois de marcar sozinho pelo `/agendar`.
 *
 * A barra **não** é um refresh de dados: ela é uma contagem do tempo que a
 * mensagem leva para chegar. Consultar o status do agendamento exigiria uma
 * rota pública nova devolvendo dado de agendamento numa página aberta na
 * internet — o oposto da decisão de manter esta resposta enxuta.
 *
 * O que a barra resolve é real: o paciente marca, não recebe nada na hora e
 * fica sem saber se deu certo. Em vez de prometer "não precisa fazer mais
 * nada" e deixá-lo no escuro, a contagem dá um prazo concreto e, ao zerar,
 * mostra o que fazer se a mensagem não chegou — que é justamente o caso
 * quando o WhatsApp da clínica está fora do ar.
 */
export const BookingConfirmed = ({
  confirmation,
  clinic,
  onNewBooking,
}: {
  confirmation: BookingConfirmation;
  clinic?: Pick<BookingClinic, "phone">;
  /** Volta ao formulário zerado, para marcar outra consulta. */
  onNewBooking?: () => void;
}) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();

    const id = setInterval(() => {
      const seconds = (Date.now() - startedAt) / 1000;

      if (seconds >= WHATSAPP_WAIT_SECONDS) {
        setElapsed(WHATSAPP_WAIT_SECONDS);
        clearInterval(id);
        return;
      }

      setElapsed(seconds);
    }, TICK_MS);

    // Conta pelo relógio (`Date.now()`), não somando ticks: aba em segundo
    // plano tem `setInterval` estrangulado pelo navegador, e a soma de ticks
    // ficaria para trás — a barra travaria pela metade ao voltar para a aba.
    return () => clearInterval(id);
  }, []);

  const done = elapsed >= WHATSAPP_WAIT_SECONDS;
  const remaining = Math.ceil(WHATSAPP_WAIT_SECONDS - elapsed);

  return (
    <Stack sx={{ alignItems: "center", textAlign: "center", py: 4 }}>
      <CheckCircleIcon sx={{ fontSize: 56, color: "success.main", mb: 2 }} />

      <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
        Consulta marcada
      </Typography>

      <Typography variant="body1" sx={{ mt: 1 }}>
        {longDate(confirmation.startsAt)}, às {time(confirmation.startsAt)}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
        {confirmation.clinicName}
      </Typography>

      <Box sx={{ mt: 4, width: "100%", maxWidth: 380 }}>
        {done ? (
          <Alert severity="info" sx={{ textAlign: "left" }}>
            Se a mensagem não chegou, confira o WhatsApp que você informou —
            ou fale com a clínica
            {clinic?.phone ? ` pelo ${formatPhone(clinic.phone)}` : ""}. Seu
            horário está reservado de qualquer forma.
          </Alert>
        ) : (
          <>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Enviando a confirmação no seu WhatsApp…
              </Typography>
              {/* Segundos, não porcentagem: "faltam 12s" é a informação que
                  a pessoa quer; "40%" não diz de quê. */}
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {remaining}s
              </Typography>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={(elapsed / WHATSAPP_WAIT_SECONDS) * 100}
              sx={{ height: 6, borderRadius: 999 }}
            />
          </>
        )}
      </Box>

      <Typography
        variant="body2"
        sx={{ mt: 3, maxWidth: 380, color: "text.secondary" }}
      >
        Você vai receber um lembrete no WhatsApp antes da consulta. Não
        precisa fazer mais nada.
      </Typography>

      {/* Discreto (`text`) e por último de propósito: o normal é sair da
          página aqui. Quem precisa marcar outra — segundo procedimento, ou
          para um familiar — não deveria ter que recarregar a página na mão,
          que era a única saída antes. */}
      {onNewBooking && (
        <Button
          onClick={onNewBooking}
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ mt: 3 }}
        >
          Marcar outra consulta
        </Button>
      )}
    </Stack>
  );
};
