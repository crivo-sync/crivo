import Link from "next/link";

export type PricingTier = "essencial" | "clinica" | "rede";

export type PricingFeature = {
  text: string;
  included: boolean;
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
  essencial: {
    border: "border-teal-500/30",
    hoverBorder: "hover:border-teal-500/50",
    badge: "text-teal-300 bg-teal-500/10 border-teal-500/30",
    cta: "bg-teal-600 hover:bg-teal-500 text-white",
    glow: "shadow-[0_0_40px_rgba(20,184,166,0.08)]",
    badgeLabel: null,
    popular: false,
  },
  clinica: {
    border: "border-amber-500/40",
    hoverBorder: "hover:border-amber-500/60",
    badge: "text-amber-300 bg-amber-500/10 border-amber-500/30",
    cta: "bg-amber-500 hover:bg-amber-400 text-black",
    glow: "shadow-[0_0_60px_rgba(245,158,11,0.15)]",
    badgeLabel: "Mais popular",
    popular: true,
  },
  rede: {
    border: "border-indigo-500/40",
    hoverBorder: "hover:border-indigo-500/60",
    badge: "text-indigo-300 bg-indigo-500/10 border-indigo-500/30",
    cta: "bg-indigo-600 hover:bg-indigo-500 text-white",
    glow: "shadow-[0_0_60px_rgba(99,102,241,0.15)]",
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
  const features = compact ? plan.features.slice(0, 4) : plan.features;

  return (
    <div
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
