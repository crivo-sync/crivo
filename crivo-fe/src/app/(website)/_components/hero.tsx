import Link from "next/link";

import { ContactForm } from "./contact-form";

const STATS = [
  { value: "24h", label: "janela de lembrete automático" },
  { value: "4x", label: "reenvio antes de desistir" },
  { value: "0 apps", label: "paciente confirma pelo link" },
];

export const Hero = () => {
  return (
    <section
      id="produto"
      className="relative overflow-hidden px-4 py-16 md:py-24 scroll-mt-20"
    >
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute top-1/3 -left-20 h-125 w-125 rounded-full bg-indigo-700/8 blur-[140px]" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 h-100 w-100 rounded-full bg-indigo-600/6 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-75 w-175 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/3 blur-[160px]" />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-2 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <div className="mb-6 inline-block rounded-full border border-black/15 bg-black/3 px-4 py-2">
            <p className="text-sm tracking-wide text-gray-700">
              ✨ Para clínicas de estética e odontologia
            </p>
          </div>

          <h1 className="text-5xl leading-[1.05] font-bold text-gray-900 md:text-6xl lg:text-7xl">
            O motor que evita{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-400">
              buracos na sua agenda
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600">
            Agenda, predição de no-show e mensageria automática num único motor.
            O Crivo avisa quando um horário está em risco — e age antes de virar
            buraco na sua operação.
          </p>

          <div className="flex flex-col gap-4 pt-8 sm:flex-row">
            <Link
              href="#contato"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-[0_0_40px_rgba(79,70,229,0.3)] transition-all duration-300 hover:bg-indigo-500 hover:shadow-[0_0_60px_rgba(79,70,229,0.4)]"
            >
              <span>→</span>
              Comece grátis
            </Link>
            <Link
              href="/planos"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-black/20 px-8 py-4 text-base font-semibold text-gray-900 transition-all duration-300 hover:bg-black/5"
            >
              Ver planos
            </Link>
          </div>

          <div className="flex flex-wrap gap-8 pt-12">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold tracking-tight text-gray-900">
                  {stat.value}
                </div>
                <div className="mt-0.5 text-[13px] text-gray-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          id="contato"
          className="rounded-3xl border border-black/10 bg-linear-to-b from-black/3 to-transparent p-7 shadow-2xl backdrop-blur-xl scroll-mt-24"
        >
          <ContactForm />
        </div>
      </div>
    </section>
  );
};
