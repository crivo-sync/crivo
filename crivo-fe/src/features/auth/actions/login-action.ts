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
import { getUsers } from "../http/get-users";
import { login } from "../http/login";
import { loginSchema, type LoginSchema } from "../schemas/login";
import type { ActionResult } from "../types";

function decodeSub(accessToken: string): string | null {
  try {
    const payload = accessToken.split(".")[1];
    const { sub } = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    return typeof sub === "string" ? sub : null;
  } catch {
    return null;
  }
}

/**
 * Não existe endpoint "quem sou eu" no crivo-be — `GET /users` é o único
 * jeito de descobrir o nome, e é ADMIN-only. Para STAFF (ou se a busca
 * falhar por qualquer motivo), cai no e-mail digitado no formulário.
 */
async function resolveDisplayName(
  accessToken: string,
  fallbackEmail: string,
): Promise<string> {
  const userId = decodeSub(accessToken);
  if (!userId) return fallbackEmail;

  try {
    const users = await getUsers(accessToken);
    return users.find((user) => user.id === userId)?.name ?? fallbackEmail;
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
