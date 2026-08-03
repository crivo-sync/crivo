import { api, authHeaders } from "@/config/api";
import type { Profile } from "../types";

export async function getProfile(accessToken: string): Promise<Profile> {
  return api
    .get("users/me", { headers: authHeaders(accessToken) })
    .json<Profile>();
}
