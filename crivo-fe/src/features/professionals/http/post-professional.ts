import { api, authHeaders } from "@/config/api";
import type { Professional } from "../types";
import type { CreateProfessionalSchema } from "../schemas/professional";

export async function postProfessional(
  input: CreateProfessionalSchema,
  accessToken: string,
): Promise<Professional> {
  return api
    .post("professionals", { json: input, headers: authHeaders(accessToken) })
    .json<Professional>();
}
