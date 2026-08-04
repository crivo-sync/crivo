import { api } from "@/config/api";
import type { ConfirmationResult } from "../types";

/** Rota pública — única que de fato confirma a presença. */
export async function postConfirmation(
  token: string,
): Promise<ConfirmationResult> {
  return api.post(`c/${token}/confirm`).json<ConfirmationResult>();
}
