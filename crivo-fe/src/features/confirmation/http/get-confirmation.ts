import { api } from "@/config/api";
import type { ConfirmationPreview } from "../types";

/** Rota pública — sem auth, o token opaco é a única credencial. */
export async function getConfirmation(
  token: string,
): Promise<ConfirmationPreview> {
  return api.get(`c/${token}`).json<ConfirmationPreview>();
}
