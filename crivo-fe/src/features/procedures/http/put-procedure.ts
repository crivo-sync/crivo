import { api, authHeaders } from "@/config/api";
import type { Procedure } from "../types";
import type { UpdateProcedureSchema } from "../schemas/procedure";

export async function putProcedure(
  id: string,
  input: UpdateProcedureSchema,
  accessToken: string,
): Promise<Procedure> {
  return api
    .patch(`procedures/${id}`, {
      json: input,
      headers: authHeaders(accessToken),
    })
    .json<Procedure>();
}
