"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { validateImageFile } from "@/lib/image-upload";
import { postAvatar } from "../http/post-avatar";
import type { ActionResult, Profile } from "../types";

export async function uploadAvatarAction(
  file: File,
): Promise<ActionResult<Profile>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const invalid = validateImageFile(file);
  if (invalid) return { success: false, message: invalid };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      postAvatar(file, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Foto atualizada.", data: result.data };
  } catch (error) {
    console.error("[Upload Avatar Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a foto.",
    };
  }
}
