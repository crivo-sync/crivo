"use server";

import {
  FORBIDDEN_MESSAGE,
  requireAdmin,
  SESSION_EXPIRED_MESSAGE,
} from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { validateImageFile } from "@/lib/image-upload";
import { uploadLogo } from "../http/upload-logo";
import type { ActionResult, Tenant } from "../types";

export async function uploadLogoAction(
  file: File,
): Promise<ActionResult<Tenant>> {
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

  const invalid = validateImageFile(file);
  if (invalid) return { success: false, message: invalid };

  try {
    const result = await withAuth(auth.session.accessToken, (token) =>
      uploadLogo(file, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Logo atualizado.", data: result.data };
  } catch (error) {
    console.error("[Upload Logo Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o logo.",
    };
  }
}
