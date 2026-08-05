"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import { postPatientsImport } from "../http/post-patients-import";
import type { ActionResult, ImportResult } from "../types";

/**
 * `dryRun` decide se é prévia ou gravação. O backend valida o papel (ADMIN) e
 * as regras do arquivo — aqui só repassamos, para que a tela nunca seja a
 * autoridade sobre o que pode ser importado.
 */
export async function importPatientsAction(
  formData: FormData,
): Promise<ActionResult<ImportResult>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const file = formData.get("file");
  const dryRun = formData.get("dryRun") === "true";

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Selecione um arquivo CSV." };
  }

  try {
    const result = await withAuth(session.accessToken, (token) =>
      postPatientsImport(file, dryRun, token),
    );
    if (!result.ok) return { success: false, message: result.message };

    return {
      success: true,
      message: dryRun ? "Arquivo analisado." : "Importação concluída.",
      data: result.data,
    };
  } catch (error) {
    console.error("[Import Patients Action Error]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível importar o arquivo.",
    };
  }
}
