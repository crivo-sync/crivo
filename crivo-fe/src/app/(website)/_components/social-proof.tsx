"use client";

import { ScrollReveal } from "@/components/ui/scroll-reveal";

export const SocialProof = () => {
  return (
    <section className="relative overflow-hidden bg-white pt-16 pb-4 text-gray-900">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <ScrollReveal direction="up" delay={50} duration={600}>
          <p className="mb-8 text-[13px] font-semibold tracking-widest text-gray-500 uppercase">
            Clínicas que confiam no Crivo
          </p>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={150} duration={700}>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex h-14 w-36 items-center justify-center rounded-xl border border-black/8 bg-black/3 text-xs text-gray-500 transition-all duration-300 hover:border-black/15 hover:bg-black/4"
              >
                Logo cliente
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
