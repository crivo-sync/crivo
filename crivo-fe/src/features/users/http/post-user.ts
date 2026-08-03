import { api, authHeaders } from "@/config/api";
import type { User } from "../types";
import type { CreateUserSchema } from "../schemas/user";

export async function postUser(
  input: CreateUserSchema,
  accessToken: string,
): Promise<User> {
  return api
    .post("users", { json: input, headers: authHeaders(accessToken) })
    .json<User>();
}
