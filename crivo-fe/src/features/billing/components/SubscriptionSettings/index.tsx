"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErrorServer } from "@/components/ui/error-server";
import { useIsAdmin } from "@/components/providers/session-provider";
import { trialDaysLeft } from "@/lib/trial";
import { useTenant } from "@/features/tenant/hooks/use-tenant";
import { useCheckout } from "../../hooks/use-checkout";
import { useMessageUsage } from "../../hooks/use-message-usage";
import { usePlans } from "../../hooks/use-plans";
import { MessageUsageCard } from "../MessageUsageCard";
import { PlanCard } from "./plan-card";

/** Mostra o plano atual (ou o estado do trial) e a lista de planos para
 * assinar/trocar. Some sem quebrar se a busca falhar — a tela de
 * Configurações continua útil pelas outras abas. */
export const SubscriptionSettings = () => {
  const canManage = useIsAdmin();
  const {
    tenant,
    isLoading: isLoadingTenant,
    error: tenantError,
    refetch: refetchTenant,
  } = useTenant();
  const {
    plans,
    isLoading: isLoadingPlans,
    error: plansError,
    refetch: refetchPlans,
  } = usePlans();
  const { startCheckout, loadingPlanId } = useCheckout();
  // Falha aqui não impede o resto da tela: o card só some, os planos
  // continuam navegáveis.
  const { usage } = useMessageUsage();

  if (tenantError) {
    return (
      <ErrorServer message={tenantError.message} onRetry={refetchTenant} />
    );
  }
  if (isLoadingTenant || isLoadingPlans) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={32} width={280} />
        <Skeleton variant="rounded" height={220} />
      </Stack>
    );
  }
  if (!tenant) {
    return (
      <ErrorServer
        message="Não foi possível carregar os dados da clínica."
        onRetry={refetchTenant}
      />
    );
  }

  return (
    <Stack spacing={3}>
      {tenant.subscriptionStatus === "TRIALING" && (
        <Alert severity="info">
          Período de teste — {trialDaysLeft(tenant.trialEndsAt)} dia(s)
          restante(s). Escolha um plano abaixo para continuar depois que o
          teste acabar.
        </Alert>
      )}
      {tenant.subscriptionStatus === "PAST_DUE" && (
        <Alert severity="warning">
          Não conseguimos cobrar sua última fatura. Atualize a forma de
          pagamento para evitar a suspensão do acesso.
        </Alert>
      )}
      {tenant.subscriptionStatus === "CANCELED" && (
        <Alert severity="error">
          Sua assinatura foi cancelada. Escolha um plano abaixo para
          reativar.
        </Alert>
      )}

      {plansError && (
        <ErrorServer
          message="Não foi possível carregar os planos agora."
          onRetry={refetchPlans}
        />
      )}

      {usage && <MessageUsageCard usage={usage} />}

      {!canManage && (
        <Typography variant="body2" color="text.secondary">
          Apenas administradores podem alterar a assinatura da clínica.
        </Typography>
      )}

      <Box>
        <Grid container spacing={2}>
          {plans.map((plan) => (
            <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 3 }}>
              <PlanCard
                plan={plan}
                isCurrent={tenant.planId === plan.id}
                isLoading={loadingPlanId === plan.id}
                canSelect={canManage}
                onSelect={startCheckout}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Stack>
  );
};
