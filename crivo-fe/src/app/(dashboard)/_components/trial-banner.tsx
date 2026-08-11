"use client";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

import type { SubscriptionStatus } from "@/features/tenant/types";

type TrialBannerProps = {
  status: SubscriptionStatus;
  endsAt: string;
};

/** Só avisa nos últimos 3 dias — antes disso o banner seria ruído para
 * quem ainda tem trial de sobra. */
const WARN_DAYS = 3;

function daysUntil(iso: string): number {
  const diffMs = new Date(iso).getTime() - Date.now();
  return Math.ceil(diffMs / 86_400_000);
}

export const TrialBanner = ({ status, endsAt }: TrialBannerProps) => {
  if (status === "EXPIRED") {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <AlertTitle>Seu período de teste acabou</AlertTitle>
        Fale com o suporte para continuar usando o Crivo.
      </Alert>
    );
  }

  if (status !== "TRIALING") return null;

  const days = daysUntil(endsAt);
  if (days > WARN_DAYS) return null;

  return (
    <Alert severity={days <= 1 ? "error" : "warning"} sx={{ mb: 3 }}>
      <AlertTitle>
        {days <= 0
          ? "Seu teste acaba hoje"
          : days === 1
            ? "Seu teste acaba amanhã"
            : `Seu teste acaba em ${days} dias`}
      </AlertTitle>
      Depois disso o acesso ao painel é bloqueado até a assinatura ser
      regularizada.
    </Alert>
  );
};
