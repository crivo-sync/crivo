import { api, authHeaders } from "@/config/api";
import type { ClinicalPhoto, ClinicalPhotoKind } from "../types";

export async function getClinicalPhotos(
  patientId: string,
  accessToken: string,
): Promise<ClinicalPhoto[]> {
  return api
    .get(`patients/${patientId}/photos`, { headers: authHeaders(accessToken) })
    .json<ClinicalPhoto[]>();
}

export async function postClinicalPhoto(
  input: {
    patientId: string;
    appointmentId: string;
    kind: ClinicalPhotoKind;
    caption?: string;
    file: File;
  },
  accessToken: string,
): Promise<ClinicalPhoto> {
  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("kind", input.kind);
  if (input.caption) formData.append("caption", input.caption);

  // Sem Content-Type manual: o browser define o boundary a partir do FormData.
  return api
    .post(
      `patients/${input.patientId}/appointments/${input.appointmentId}/photos`,
      { body: formData, headers: authHeaders(accessToken) },
    )
    .json<ClinicalPhoto>();
}

export async function deleteClinicalPhoto(
  patientId: string,
  photoId: string,
  accessToken: string,
): Promise<void> {
  // 204 sem corpo — sem `.json()`, que lançaria em resposta vazia.
  await api.delete(`patients/${patientId}/photos/${photoId}`, {
    headers: authHeaders(accessToken),
  });
}
