"use server";

import { getPlans } from "../http/get-plans";
import type { ActionResult, Plan } from "../types";

export async function getPlansAction(): Promise<ActionResult<Plan[]>> {
  try {
    const plans = await getPlans();
    return { success: true, message: "Sucesso", data: plans };
  } catch (error) {
    console.error("[Get Plans Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
