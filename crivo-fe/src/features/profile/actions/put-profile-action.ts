"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
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
    const result = await withAuth(session.accessToken, (token) =>
      putProfile(parsed.data, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Perfil atualizado.", data: result.data };
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
