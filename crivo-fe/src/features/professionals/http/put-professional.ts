import { api, authHeaders } from "@/config/api";
import type { Professional } from "../types";
import type { UpdateProfessionalSchema } from "../schemas/professional";

export async function putProfessional(
  id: string,
  input: UpdateProfessionalSchema,
  accessToken: string,
): Promise<Professional> {
  return api
    .patch(`professionals/${id}`, {
      json: input,
      headers: authHeaders(accessToken),
    })
    .json<Professional>();
}
