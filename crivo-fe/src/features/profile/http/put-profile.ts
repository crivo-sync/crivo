import { api, authHeaders } from "@/config/api";
import type { Profile } from "../types";
import type { UpdateProfileSchema } from "../schemas/profile";

export async function putProfile(
  input: UpdateProfileSchema,
  accessToken: string,
): Promise<Profile> {
  return api
    .patch("users/me", { json: input, headers: authHeaders(accessToken) })
    .json<Profile>();
}
