import type { Metadata } from "next";
import type { HTTPError } from "ky";

import { Logo } from "@/components/ui/logo";
import { getConfirmation } from "@/features/confirmation/http/get-confirmation";
import { ConfirmationCard } from "./_components/confirmation-card";

export const metadata: Metadata = {
  title: "Confirmar presença — Crivo",
};

type ConfirmationPageProps = {
  params: Promise<{ token: string }>;
};

/**
 * Rota pública (fora de `(dashboard)`/`(auth)`, sem middleware de sessão) —
 * é a página que abre quando o paciente toca no link do lembrete de
 * WhatsApp. Busca os dados no servidor (o token nunca aparece em JS do
 * cliente) e delega a ação de confirmar para um Client Component.
 */
export default async function ConfirmationPage({
  params,
}: ConfirmationPageProps) {
  const { token } = await params;

  let errorMessage: string | null = null;
  let preview: Awaited<ReturnType<typeof getConfirmation>> | null = null;

  try {
    preview = await getConfirmation(token);
  } catch (error) {
    const httpError = error as HTTPError;
    errorMessage =
      httpError.response?.status === 404
        ? "Link inválido ou expirado."
        : error instanceof Error
          ? error.message
          : "Não foi possível carregar seu agendamento.";
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-10">
      <div className="mb-6">
        <Logo />
      </div>

      {preview ? (
        <ConfirmationCard token={token} preview={preview} />
      ) : (
        <div className="w-full max-w-sm rounded-3xl border border-black/8 bg-white p-7 text-center shadow-xl shadow-indigo-950/5">
          <p className="text-sm text-gray-600">{errorMessage}</p>
        </div>
      )}
    </main>
  );
}
