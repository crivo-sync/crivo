"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { putProfile } from "../http/put-profile";
import { updateProfileSchema, type UpdateProfileSchema } from "../schemas/profile";
import type { ActionResult, Profile } from "../types";

export async function putProfileAction(
  input: UpdateProfileSchema,
): Promise<ActionResult<Profile>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Dados inválidos." };
  }

  try {
    const data = await putProfile(parsed.data, session.accessToken);
    return { success: true, message: "Perfil atualizado.", data };
  } catch (error) {
    console.error("[Put Profile Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o perfil.",
    };
  }
}
