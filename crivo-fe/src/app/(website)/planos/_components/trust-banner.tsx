"use client";

import { ScrollReveal } from "@/components/ui/scroll-reveal";

const ITEMS = [
  {
    title: "Sem fidelidade",
    description: "Cancele quando quiser, sem multa e sem burocracia.",
    iconClass: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    title: "Migração assistida",
    description: "Ajudamos a importar sua agenda e pacientes atuais.",
    iconClass: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
    ),
  },
  {
    title: "Suporte em português",
    description: "Time real respondendo por WhatsApp, todo dia útil.",
    iconClass: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
        />
      </svg>
    ),
  },
];

export const TrustBanner = () => {
  return (
    <section className="relative overflow-hidden px-6 pt-20 text-gray-900">
      <div className="relative z-10 mx-auto max-w-4xl">
        <ScrollReveal
          direction="up"
          duration={800}
          className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-linear-to-br from-indigo-500/8 via-black/2 to-violet-500/5 p-10 text-center backdrop-blur-sm"
        >
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-60 w-100 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[100px]" />

          <div className="relative">
            <h2 className="mb-10 text-2xl font-bold tracking-tight text-gray-900">
              Sua clínica no controle, do primeiro dia
            </h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {ITEMS.map((item) => (
                <div key={item.title} className="flex flex-col items-center">
                  <div
                    className={`mb-4 flex size-11 items-center justify-center rounded-2xl border ${item.iconClass}`}
                  >
                    {item.icon}
                  </div>
                  <div className="mb-1.5 text-sm font-bold text-gray-900">
                    {item.title}
                  </div>
                  <p className="text-[13px] leading-relaxed text-gray-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
