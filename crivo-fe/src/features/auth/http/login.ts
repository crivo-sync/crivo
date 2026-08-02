import { api } from "@/config/api";
import type { TokenPair } from "../types";
import type { LoginSchema } from "../schemas/login";

/** Endpoint público: não leva Bearer token (é ele quem emite o par de tokens). */
export async function login(credentials: LoginSchema): Promise<TokenPair> {
  return api.post("auth/login", { json: credentials }).json<TokenPair>();
}
