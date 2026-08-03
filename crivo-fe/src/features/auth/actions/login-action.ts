"use server";

import { cookies } from "next/headers";
import { HTTPError } from "ky";

import {
  ACCESS_TOKEN_MAX_AGE,
  DISPLAY_NAME_COOKIE,
  REFRESH_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/session";
import { getProfile } from "@/features/profile/http/get-profile";
import { login } from "../http/login";
import { loginSchema, type LoginSchema } from "../schemas/login";
import type { ActionResult } from "../types";

/**
 * `GET /users/me` responde para qualquer papel autenticado. Antes daqui
 * existir, o nome vinha de `GET /users` + filtro pelo `sub` do JWT — rota
 * ADMIN-only, então todo STAFF caía no fallback e via o próprio e-mail no
 * lugar do nome. O fallback continua só para falha de rede.
 */
async function resolveDisplayName(
  accessToken: string,
  fallbackEmail: string,
): Promise<string> {
  try {
    const profile = await getProfile(accessToken);
    return profile.name || fallbackEmail;
  } catch {
    return fallbackEmail;
  }
}

export async function loginAction(
  input: LoginSchema,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Dados de login inválidos." };
  }

  try {
    const { accessToken, refreshToken } = await login(parsed.data);
    const displayName = await resolveDisplayName(accessToken, parsed.data.email);
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE, accessToken, {
      ...SESSION_COOKIE_OPTIONS,
      httpOnly: true,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
    cookieStore.set(REFRESH_COOKIE, refreshToken, {
      ...SESSION_COOKIE_OPTIONS,
      httpOnly: true,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
    cookieStore.set(DISPLAY_NAME_COOKIE, displayName, {
      ...SESSION_COOKIE_OPTIONS,
      httpOnly: false,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    return { success: true, message: "Login realizado com sucesso.", data: undefined };
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 401) {
      return { success: false, message: "E-mail ou senha incorretos." };
    }

    console.error("[Login Action Error]", error);
    return {
      success: false,
      message: "Não foi possível fazer login. Tente novamente.",
    };
  }
}
