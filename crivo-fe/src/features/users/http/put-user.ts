import { api, authHeaders } from "@/config/api";
import type { User } from "../types";
import type { UpdateUserSchema } from "../schemas/user";

export async function putUser(
  id: string,
  input: UpdateUserSchema,
  accessToken: string,
): Promise<User> {
  return api
    .patch(`users/${id}`, { json: input, headers: authHeaders(accessToken) })
    .json<User>();
}
