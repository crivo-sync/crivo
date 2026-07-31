"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "fade";
  delay?: number;
  duration?: number;
  threshold?: number;
};

/**
 * Revela o conteúdo com fade + translate quando entra no viewport.
 * IntersectionObserver puro — sem lib externa de animação.
 */
export const ScrollReveal = ({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 700,
  threshold = 0.1,
}: ScrollRevealProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold, rootMargin: "0px 0px -50px 0px" },
    );

    observer.observe(node);
    return () => observer.unobserve(node);
  }, [threshold]);

  const directionClass = {
    up: "translate-y-10",
    down: "-translate-y-10",
    left: "translate-x-10",
    right: "-translate-x-10",
    fade: "",
  }[direction];

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all ease-out",
        isVisible ? "translate-x-0 translate-y-0 opacity-100" : cn("opacity-0", directionClass),
        className,
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.21, 1.02, 0.43, 1.01)",
      }}
    >
      {children}
    </div>
  );
};
