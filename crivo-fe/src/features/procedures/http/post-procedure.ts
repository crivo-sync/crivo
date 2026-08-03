import { api, authHeaders } from "@/config/api";
import type { Procedure } from "../types";
import type { CreateProcedureSchema } from "../schemas/procedure";

export async function postProcedure(
  input: CreateProcedureSchema,
  accessToken: string,
): Promise<Procedure> {
  return api
    .post("procedures", { json: input, headers: authHeaders(accessToken) })
    .json<Procedure>();
}
