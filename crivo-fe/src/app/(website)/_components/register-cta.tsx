import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "lucide-react";

const BULLETS = [
  "Agenda, predição de no-show e mensageria num painel só",
  "Link de agendamento online para seus pacientes",
  "Sem cartão de crédito para testar",
];

export const RegisterCta = () => {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">Comece grátis</h3>
        <p className="mt-1.5 text-sm text-gray-600">
          Teste por 14 dias. Leva menos de um minuto para criar sua conta.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {BULLETS.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2.5 text-sm text-gray-700">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <CheckIcon className="size-3" strokeWidth={2.5} />
            </span>
            {bullet}
          </li>
        ))}
      </ul>

      <Link
        href="/cadastro"
        className="group mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 text-base font-semibold text-white shadow-[0_0_30px_rgba(79,70,229,0.25)] transition-all duration-300 hover:bg-indigo-500 hover:shadow-[0_0_45px_rgba(79,70,229,0.4)]"
      >
        Criar conta grátis
        <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </Link>

      <p className="mt-4 text-center text-xs text-gray-500">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-gray-700 hover:text-indigo-600">
          Entrar
        </Link>
      </p>
    </div>
  );
};
