"use client";

import { useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import { useOnboardingStatus } from "../../hooks/use-onboarding-status";

type Step = {
  done: boolean;
  label: string;
  help: string;
  href: string;
  cta: string;
};

/**
 * O que falta para a clínica sair do zero.
 *
 * Clínica criada pelo cadastro nasce sem profissional e sem procedimento — e
 * sem os dois a agenda não calcula horário e o `/agendar` divulgado responde
 * "Agenda ainda não disponível". Antes disto, nada no painel dizia isso: a
 * clínica descobria pelo paciente reclamando que o link não funciona.
 *
 * **Checklist, não wizard obrigatório**: travar quem só quer olhar o produto
 * antes de preencher é pior do que deixar entrar e mostrar o que falta.
 */
export const OnboardingChecklist = () => {
  const { status, isLoading, error } = useOnboardingStatus();
  const [copied, setCopied] = useState(false);

  // Some sozinho quando a clínica está operando — o checklist é de partida,
  // não um painel permanente. Falha na busca também some: é um card auxiliar,
  // e um erro aqui não pode roubar a tela do dia a dia.
  if (isLoading || error || !status || status.isComplete) return null;

  const steps: Step[] = [
    {
      done: status.hasProfessional,
      label: "Cadastre quem atende",
      help: "Sem profissional a agenda não tem grade de horário.",
      href: "/painel/profissionais",
      cta: "Cadastrar profissional",
    },
    {
      done: status.hasProcedure,
      label: "Cadastre os procedimentos",
      help: "A duração de cada um é o que define se o horário cabe.",
      href: "/painel/procedimentos",
      cta: "Cadastrar procedimento",
    },
    {
      done: status.hasAppointment,
      label: "Marque o primeiro atendimento",
      help: "Vale um teste: é assim que você vê o lembrete automático saindo.",
      href: "/painel/agenda",
      cta: "Ir para a agenda",
    },
  ];

  const doneCount = steps.filter((step) => step.done).length;
  const bookingUrl =
    typeof window === "undefined"
      ? `/agendar/${status.subdomain}`
      : `${window.location.origin}/agendar/${status.subdomain}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // O primeiro pendente é o único com botão em destaque: uma lista com três
  // botões iguais não diz por onde começar.
  const nextStep = steps.find((step) => !step.done);

  return (
    <Card variant="outlined" sx={{ p: 2.5, borderColor: "primary.main" }}>
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", mb: 0.5 }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Falta pouco para sua agenda funcionar
        </Typography>
        <Chip
          size="small"
          label={`${doneCount} de ${steps.length}`}
          color={doneCount === 0 ? "default" : "primary"}
        />
      </Stack>

      <LinearProgress
        variant="determinate"
        value={(doneCount / steps.length) * 100}
        sx={{ height: 6, borderRadius: 999, mb: 2 }}
      />

      <Stack spacing={1.5}>
        {steps.map((step) => (
          <Stack
            key={step.label}
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "flex-start" }}
          >
            {step.done ? (
              <CheckCircleIcon fontSize="small" color="success" />
            ) : (
              <RadioButtonUncheckedIcon fontSize="small" color="disabled" />
            )}

            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: step.done ? 400 : 500,
                  color: step.done ? "text.secondary" : "text.primary",
                  textDecoration: step.done ? "line-through" : undefined,
                }}
              >
                {step.label}
              </Typography>
              {!step.done && (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {step.help}
                </Typography>
              )}
            </Box>

            {!step.done && (
              <Button
                component={Link}
                href={step.href}
                size="small"
                variant={step === nextStep ? "contained" : "text"}
                sx={{ flexShrink: 0 }}
              >
                {step.cta}
              </Button>
            )}
          </Stack>
        ))}
      </Stack>

      {/* O link fica visível desde o começo, mas com o aviso de que ainda não
          funciona — divulgar antes de ter profissional e procedimento é
          exatamente como a clínica descobre o problema pelo paciente. */}
      <Box sx={{ mt: 2.5 }}>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Link de agendamento da sua clínica
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", mt: 0.5 }}
        >
          <Typography
            variant="body2"
            sx={{ wordBreak: "break-all", fontFamily: "monospace" }}
          >
            {bookingUrl}
          </Typography>
          <Button
            size="small"
            startIcon={<ContentCopyIcon fontSize="small" />}
            onClick={handleCopy}
            sx={{ flexShrink: 0 }}
          >
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </Stack>

        {(!status.hasProfessional || !status.hasProcedure) && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            Este link ainda não aceita agendamento — falta cadastrar
            profissional e procedimento.
          </Alert>
        )}
      </Box>
    </Card>
  );
};
