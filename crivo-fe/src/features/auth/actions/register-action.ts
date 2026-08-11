"use server";

import { HTTPError } from "ky";

import { register } from "../http/register";
import { registerSchema, type RegisterSchema } from "../schemas/register";
import { loginAction } from "./login-action";
import type { ActionResult } from "../types";

export async function registerAction(
  input: RegisterSchema,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  try {
    await register(parsed.data);
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 409) {
      // Mensagens do crivo-be são fixas em inglês — distingue pelo conteúdo.
      const body = error.data as { message?: string } | undefined;
      const jaExiste = body?.message?.toLowerCase().includes("subdomain")
        ? "Este endereço de clínica já está em uso. Escolha outro."
        : "Este e-mail já está cadastrado. Tente entrar.";
      return { success: false, message: jaExiste };
    }

    console.error("[Register Action Error]", error);
    return {
      success: false,
      message: "Não foi possível criar a conta. Tente novamente.",
    };
  }

  // O backend não devolve token no cadastro — loga em seguida com as
  // mesmas credenciais para a pessoa cair direto no painel.
  return loginAction({ email: parsed.data.email, password: parsed.data.password });
}
