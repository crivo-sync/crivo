import Link from "next/link";

export type PricingTier =
  | "trial"
  | "solo"
  | "basico"
  | "intermediario"
  | "avancado";

export type PricingFeature = {
  text: string;
  included: boolean;
  /** Linha cujo valor muda entre planos — sobrevive ao corte do compacto. */
  varies?: boolean;
};

export type PricingPlan = {
  tier: PricingTier;
  name: string;
  tagline: string;
  price: string;
  priceSuffix?: string;
  detail: string;
  ctaLabel: string;
  ctaHref: string;
  features: PricingFeature[];
};

const CheckIcon = () => (
  <svg
    className="h-4 w-4 shrink-0 text-emerald-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg
    className="h-4 w-4 shrink-0 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PLAN_ACCENT: Record<
  PricingTier,
  {
    border: string;
    hoverBorder: string;
    badge: string;
    cta: string;
    glow: string;
    badgeLabel: string | null;
    popular: boolean;
  }
> = {
  /**
   * Uma família de cor só (o índigo da marca), variando **intensidade** em
   * vez de matiz — decisão de 10/08/2026: três matizes lado a lado (teal,
   * âmbar, índigo) fazem a página parecer três produtos, e o amarelo do
   * "Mais popular" puxava mais atenção que o próprio preço. O plano
   * recomendado é o único com fundo sólido, os outros ficam em contorno.
   */
  /**
   * O trial é o único card que não é um plano pago — ganha a cor de
   * "positivo/grátis" (esmeralda, a mesma dos checks de feature) em vez do
   * índigo dos planos. Fica distinto sem competir com o destaque sólido do
   * "Mais popular", que segue sendo o único de fundo preenchido.
   */
  trial: {
    border: "border-emerald-500/30",
    hoverBorder: "hover:border-emerald-500/50",
    badge: "text-emerald-700 bg-emerald-500/10 border-emerald-500/25",
    cta: "bg-white text-emerald-700 border border-emerald-600/30 hover:border-emerald-600 hover:bg-emerald-50",
    glow: "shadow-[0_0_40px_rgba(16,185,129,0.06)]",
    badgeLabel: "Comece por aqui",
    popular: false,
  },
  solo: {
    border: "border-black/10",
    hoverBorder: "hover:border-indigo-500/40",
    badge: "text-indigo-600 bg-indigo-500/8 border-indigo-500/20",
    cta: "bg-white text-indigo-700 border border-indigo-600/30 hover:border-indigo-600 hover:bg-indigo-50",
    glow: "shadow-[0_0_40px_rgba(79,70,229,0.04)]",
    badgeLabel: null,
    popular: false,
  },
  basico: {
    border: "border-black/10",
    hoverBorder: "hover:border-indigo-500/40",
    badge: "text-indigo-600 bg-indigo-500/8 border-indigo-500/20",
    cta: "bg-white text-indigo-700 border border-indigo-600/30 hover:border-indigo-600 hover:bg-indigo-50",
    glow: "shadow-[0_0_40px_rgba(79,70,229,0.04)]",
    badgeLabel: null,
    popular: false,
  },
  intermediario: {
    border: "border-indigo-600/50",
    hoverBorder: "hover:border-indigo-600/70",
    badge: "text-indigo-700 bg-indigo-500/10 border-indigo-500/30",
    cta: "bg-indigo-600 hover:bg-indigo-500 text-white",
    glow: "shadow-[0_0_60px_rgba(79,70,229,0.18)]",
    badgeLabel: "Mais popular",
    popular: true,
  },
  avancado: {
    border: "border-black/10",
    hoverBorder: "hover:border-indigo-500/40",
    badge: "text-indigo-600 bg-indigo-500/8 border-indigo-500/20",
    cta: "bg-white text-indigo-700 border border-indigo-600/30 hover:border-indigo-600 hover:bg-indigo-50",
    glow: "shadow-[0_0_40px_rgba(79,70,229,0.04)]",
    badgeLabel: null,
    popular: false,
  },
};

export const PricingCard = ({
  plan,
  compact = false,
}: {
  plan: PricingPlan;
  compact?: boolean;
}) => {
  const accent = PLAN_ACCENT[plan.tier];
  /**
   * O compacto (home) mostra só o que **varia** entre os planos: limite de
   * profissionais + os 4 diferenciais. Depois deles vem a base comum, que
   * repetida em quatro colunas idênticas não ajuda a escolher.
   *
   * A franquia de mensagem entra junto por ser o segundo número que decide
   * a compra — e por ser o único item da base que muda de plano para plano.
   */
  const features = compact
    ? plan.features.filter(
        (feature, index) =>
          // Os diferenciais vêm primeiro em `planFeatureLines`…
          index < 5 ||
          // …e `varies` recupera o que muda de plano mas ficou na base.
          feature.varies,
      )
    : plan.features;

  return (
    <div
      // Só para os testes isolarem "o card do Solo" sem depender de heurística
      // de DOM — nada visual depende disto.
      data-testid={`plan-card-${plan.tier}`}
      className={`relative flex h-full flex-col rounded-3xl border bg-linear-to-b from-black/3 to-transparent p-7 backdrop-blur-sm transition-all duration-500 ${accent.border} ${accent.hoverBorder} ${accent.glow} ${accent.popular ? "bg-black/2" : ""}`}
    >
      {accent.badgeLabel && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${accent.badge}`}
          >
            {accent.popular && (
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
            {accent.badgeLabel}
          </span>
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">
          {plan.tagline}
        </p>

        <div className="mt-6 flex items-end gap-1">
          <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
          {plan.priceSuffix && (
            <span className="mb-1 text-sm text-gray-600">{plan.priceSuffix}</span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-600">{plan.detail}</p>
      </div>

      <div className="mt-6">
        <Link
          href={plan.ctaHref}
          className={`flex w-full items-center justify-center rounded-full py-3.5 text-sm font-semibold transition-all duration-300 ${accent.cta}`}
        >
          {plan.ctaLabel}
        </Link>
      </div>

      <div className="my-6 h-px bg-linear-to-r from-transparent via-black/8 to-transparent" />

      <ul className="flex-1 space-y-3">
        {features.map((feature) => (
          <li
            key={feature.text}
            className={`flex items-start gap-2.5 text-sm ${
              feature.included ? "text-gray-700" : "text-gray-400"
            }`}
          >
            {feature.included ? <CheckIcon /> : <XIcon />}
            <span>{feature.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
