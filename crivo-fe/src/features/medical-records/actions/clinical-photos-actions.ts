"use server";

import { getServerSession, SESSION_EXPIRED_MESSAGE } from "@/lib/session";
import { withAuth } from "@/lib/with-auth";
import {
  deleteClinicalPhoto,
  getClinicalPhotos,
  postClinicalPhoto,
} from "../http/clinical-photos";
import type { ActionResult, ClinicalPhoto, ClinicalPhotoKind } from "../types";

// Sem checagem de papel aqui: o backend restringe a ADMIN/PROFESSIONAL e
// exige o plano com prontuário — a Server Action só repassa.
export async function getClinicalPhotosAction(
  patientId: string,
): Promise<ActionResult<ClinicalPhoto[]>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      getClinicalPhotos(patientId, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Sucesso", data: result.data };
  } catch (error) {
    console.error("[Get Clinical Photos Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}

export async function uploadClinicalPhotoAction(
  formData: FormData,
): Promise<ActionResult<ClinicalPhoto>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  const file = formData.get("file");
  const patientId = String(formData.get("patientId") ?? "");
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const kind = String(formData.get("kind") ?? "") as ClinicalPhotoKind;
  const caption = String(formData.get("caption") ?? "");

  if (!(file instanceof File) || !patientId || !appointmentId) {
    return { success: false, message: "Dados incompletos para o envio." };
  }

  try {
    const result = await withAuth(session.accessToken, (token) =>
      postClinicalPhoto(
        { patientId, appointmentId, kind, caption: caption || undefined, file },
        token,
      ),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Foto enviada.", data: result.data };
  } catch (error) {
    console.error("[Upload Clinical Photo Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}

export async function deleteClinicalPhotoAction(
  patientId: string,
  photoId: string,
): Promise<ActionResult<undefined>> {
  const session = await getServerSession();
  if (!session) return { success: false, message: SESSION_EXPIRED_MESSAGE };

  try {
    const result = await withAuth(session.accessToken, (token) =>
      deleteClinicalPhoto(patientId, photoId, token),
    );
    if (!result.ok) return { success: false, message: result.message };
    return { success: true, message: "Foto excluída.", data: undefined };
  } catch (error) {
    console.error("[Delete Clinical Photo Action Error]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro inesperado",
    };
  }
}
