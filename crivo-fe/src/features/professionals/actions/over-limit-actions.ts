"use server";

import {
  FORBIDDEN_MESSAGE,
  getServerSession,
  requireAdmin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import {
  getOverLimitStatus,
  resolveOverLimit,
} from "../http/over-limit";
import type { ActionResult, OverLimitStatus } from "../types";

export async function getOverLimitStatusAction(): Promise<
  ActionResult<OverLimitStatus>
> {
  // Leitura liberada para qualquer papel, igual à listagem: a recepção
  // precisa entender por que a agenda está com profissional a menos.
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      getOverLimitStatus(token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Over Limit Status Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}

/**
 * Recebe **quem fica**, não quem sai — mesma razão do backend: uma lista de
 * "quem sai" montada numa aba desatualizada deixaria a clínica ainda acima
 * do teto achando que resolveu.
 */
export async function resolveOverLimitAction(
  keepProfessionalIds: string[],
): Promise<ActionResult<{ deactivated: number }>> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return {
      success: false,
      message:
        auth.reason === "forbidden"
          ? FORBIDDEN_MESSAGE
          : SESSION_EXPIRED_MESSAGE,
    };
  }

  try {
    const result = await withAuth(auth.session.accessToken, (token) =>
      resolveOverLimit(keepProfessionalIds, token),
    );
    if (!result.ok) return { success: false, message: result.message };

    const { deactivated } = result.data;
    return {
      success: true,
      message:
        deactivated === 0
          ? "Nenhum profissional foi desativado."
          : deactivated === 1
            ? "1 profissional foi desativado."
            : `${deactivated} profissionais foram desativados.`,
      data: result.data,
    };
  } catch (error) {
    console.error("[Resolve Over Limit Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a escolha.",
    };
  }
}
