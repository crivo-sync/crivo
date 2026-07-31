"use client";

import { ScrollReveal } from "@/components/ui/scroll-reveal";

const TESTIMONIALS = [
  {
    accent: "border-amber-500/20 hover:border-amber-500/35",
    avatar: "bg-linear-to-tr from-amber-400 to-orange-500",
    quote: "Depoimento de cliente — a preencher.",
    name: "Nome do cliente",
    role: "Cargo, Clínica",
  },
  {
    accent: "border-emerald-500/20 hover:border-emerald-500/35",
    avatar: "bg-linear-to-tr from-emerald-400 to-teal-500",
    quote: "Depoimento de cliente — a preencher.",
    name: "Nome do cliente",
    role: "Cargo, Clínica",
  },
  {
    accent: "border-indigo-500/20 hover:border-indigo-500/35",
    avatar: "bg-linear-to-tr from-indigo-400 to-violet-500",
    quote: "Depoimento de cliente — a preencher.",
    name: "Nome do cliente",
    role: "Cargo, Clínica",
  },
];

const StarIcon = () => (
  <svg className="h-3.5 w-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export const Testimonials = () => {
  return (
    <section
      id="depoimentos"
      className="relative overflow-hidden bg-white py-20 text-gray-900 scroll-mt-20 md:py-28"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-100 w-100 rounded-full bg-indigo-600/3 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-14 flex max-w-3xl flex-col items-center text-center">
          <ScrollReveal direction="up" delay={50} duration={600}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-indigo-600 uppercase">
              <StarIcon />
              Depoimentos
            </span>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={150} duration={700}>
            <h2 className="mt-6 text-4xl leading-[1.1] font-bold tracking-tight text-gray-900 md:text-5xl">
              O que dizem{" "}
              <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-400 bg-clip-text text-transparent">
                sobre o Crivo
              </span>
            </h2>
          </ScrollReveal>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <ScrollReveal key={index} direction="up" delay={index * 100} duration={700}>
              <div
                className={`h-full rounded-3xl border bg-linear-to-b from-black/3 to-transparent p-7 backdrop-blur-sm transition-all duration-500 ${item.accent}`}
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} />
                  ))}
                </div>
                <p className="mb-6 text-[15px] leading-relaxed text-gray-700 italic">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-10 items-center justify-center rounded-full text-xs font-bold text-black ${item.avatar}`}
                  >
                    C
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{item.name}</div>
                    <div className="text-[13px] text-gray-500">{item.role}</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
