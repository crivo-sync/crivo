"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { postAvatar } from "../http/post-avatar";
import type { ActionResult, Profile } from "../types";

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadAvatarAction(
  file: File,
): Promise<ActionResult<Profile>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  // Mesma validação do backend, reforçada aqui para falhar cedo com
  // mensagem em português antes de gastar upload — o backend continua
  // sendo a autoridade final (rejeita de novo se algo escapar por aqui).
  if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.type)) {
    return {
      success: false,
      message: "Envie uma imagem JPEG, PNG ou WebP.",
    };
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return { success: false, message: "A imagem precisa ter até 5MB." };
  }

  try {
    const data = await postAvatar(file, session.accessToken);
    return { success: true, message: "Foto atualizada.", data };
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
