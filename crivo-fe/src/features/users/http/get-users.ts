import { api, authHeaders } from "@/config/api";
import type { User } from "../types";

export async function getUsers(accessToken: string): Promise<User[]> {
  return api
    .get("users", { headers: authHeaders(accessToken) })
    .json<User[]>();
}
