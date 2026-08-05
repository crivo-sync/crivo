"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Logo } from "@/components/ui/logo";

const NAV_LINKS = [
  { href: "/#produto", label: "Produto" },
  { href: "/#modulos", label: "Módulos" },
  { href: "/planos", label: "Planos" },
  { href: "/#depoimentos", label: "Depoimentos" },
];

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 w-full transition-all duration-500 ease-out ${
        scrolled
          ? "border-b border-black/10 bg-white/70 shadow-lg shadow-gray-200/50 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" aria-label="Crivo — início">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-gray-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/teste-gratis"
          className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(79,70,229,0.25)] transition-all duration-300 hover:bg-indigo-500 hover:shadow-[0_0_45px_rgba(79,70,229,0.4)]"
        >
          Comece grátis
        </Link>
      </div>
    </header>
  );
};
