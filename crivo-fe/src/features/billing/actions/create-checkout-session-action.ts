"use server";

import {
  FORBIDDEN_MESSAGE,
  requireAdmin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { createCheckoutSession } from "../http/create-checkout-session";
import type { ActionResult, CheckoutSession } from "../types";

export async function createCheckoutSessionAction(
  planId: string,
): Promise<ActionResult<CheckoutSession>> {
  // Backend exige @Roles(ADMIN) — falhamos antes com mensagem clara.
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
      createCheckoutSession(token, planId),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Create Checkout Session Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o checkout.",
    };
  }
}
