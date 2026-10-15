import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
};

export const LogoMark = ({ className }: LogoMarkProps) => {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("size-8", className)}
      aria-hidden
    >
      <defs>
        <linearGradient
          id="crivo-mark-gradient"
          x1="4"
          y1="4"
          x2="28"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
      </defs>

      <rect width="32" height="32" rx="9" fill="url(#crivo-mark-gradient)" />

      <path
        d="M21 11a6.5 6.5 0 100 10"
        stroke="white"
        strokeWidth="3.4"
        strokeLinecap="round"
        fill="none"
        transform="translate(-2 0)"
      />
      <circle cx="21.5" cy="16" r="2.1" fill="white" />
    </svg>
  );
};

type LogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
};

export const Logo = ({
  className,
  markClassName,
  wordmarkClassName,
}: LogoProps) => {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span
        className={cn(
          "text-xl font-bold tracking-tight text-gray-900",
          wordmarkClassName,
        )}
      >
        Crivo Sync
      </span>
    </span>
  );
};
