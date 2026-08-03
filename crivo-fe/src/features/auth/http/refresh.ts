import { api } from "@/config/api";
import type { TokenPair } from "../types";

/** Endpoint público: o refresh token no body é a própria credencial. */
export async function refresh(refreshToken: string): Promise<TokenPair> {
  return api.post("auth/refresh", { json: { refreshToken } }).json<TokenPair>();
}
