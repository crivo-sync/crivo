"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import { loginAction } from "../actions/login-action";
import { loginSchema, type LoginSchema } from "../schemas/login";

// Só preenche fora de produção — atalho para testar o painel localmente
// com o usuário fixo já cadastrado no backend de desenvolvimento.
const DEV_DEFAULT_VALUES: LoginSchema =
  process.env.NODE_ENV !== "production"
    ? { email: "admin@clinicasorriso.com.br", password: "senha12345" }
    : { email: "", password: "" };

export function useLogin() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: DEV_DEFAULT_VALUES,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    const result = await loginAction(values);

    if (!result.success) {
      setServerError(result.message);
      return;
    }

    router.push("/painel");
    router.refresh();
  });

  return {
    control: form.control,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
    serverError,
  };
}
