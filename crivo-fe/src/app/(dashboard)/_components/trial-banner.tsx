"use client";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

import type { SubscriptionStatus } from "@/features/tenant/types";
import { trialDaysLeft } from "@/lib/trial";

type TrialBannerProps = {
  status: SubscriptionStatus;
  endsAt: string;
};

/** Só avisa nos últimos 3 dias — antes disso o banner seria ruído para
 * quem ainda tem trial de sobra. */
const WARN_DAYS = 3;

export const TrialBanner = ({ status, endsAt }: TrialBannerProps) => {
  if (status === "EXPIRED") {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <AlertTitle>Seu período de teste acabou</AlertTitle>
        Fale com o suporte para continuar usando o Crivo Sync.
      </Alert>
    );
  }

  if (status !== "TRIALING") return null;

  const days = trialDaysLeft(endsAt);
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
