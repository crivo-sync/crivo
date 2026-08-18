"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";

import { registerAction } from "../actions/register-action";
import {
  registerSchema,
  suggestSubdomain,
  type RegisterSchema,
} from "../schemas/register";

const DEFAULT_VALUES: RegisterSchema = {
  name: "",
  tenantName: "",
  subdomain: "",
  email: "",
  phone: "",
  password: "",
};

export function useRegister() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  // Só sugere enquanto a pessoa não tiver mexido no campo à mão — depois
  // disso a escolha dela vale mais que a sugestão automática.
  const subdomainTouched = useRef(false);

  /**
   * Plano vindo da tabela de preços (`/cadastro?plano=ESSENCIAL`). Não tem
   * campo na tela: é só o repasse da escolha que a pessoa já fez no site,
   * para o limite do plano valer desde o primeiro dia do teste.
   */
  const searchParams = useSearchParams();
  const planKey = searchParams.get("plano") ?? undefined;

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleTenantNameChange = (value: string) => {
    form.setValue("tenantName", value);
    if (!subdomainTouched.current) {
      form.setValue("subdomain", suggestSubdomain(value), {
        shouldValidate: form.formState.isSubmitted,
      });
    }
  };

  const handleSubdomainChange = (value: string) => {
    subdomainTouched.current = true;
    form.setValue("subdomain", value.toLowerCase());
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    const result = await registerAction({ ...values, planKey });

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
    handleTenantNameChange,
    handleSubdomainChange,
    isSubmitting: form.formState.isSubmitting,
    serverError,
  };
}
