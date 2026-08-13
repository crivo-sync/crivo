"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { getOnboardingStatus } from "../http/get-onboarding-status";
import type { ActionResult, OnboardingStatus } from "../types";

// Leitura liberada para qualquer papel — o backend não usa @Roles no GET.
export async function getOnboardingStatusAction(): Promise<
  ActionResult<OnboardingStatus>
> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      getOnboardingStatus(token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Onboarding Status Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
