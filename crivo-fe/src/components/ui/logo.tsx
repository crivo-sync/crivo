import { cn } from "@/lib/utils";
import Image from "next/image";

type LogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
};

export const Logo = ({ className, wordmarkClassName }: LogoProps) => {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/assets/images/crivo-sync-logo.png"
        width={50}
        height={50}
        alt="Crivo Sync"
      />
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
