import type { Metadata } from "next";
import { Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// Space Grotesk em todo o produto — site institucional e painel. Carregada
// uma única vez aqui e consumida via `var(--font-sans)`: pelo Tailwind no
// site e pelo theme do MUI no admin (src/config/mui-theme.ts).
const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crivo",
  description: "Crivo - O gerenciamento completo de sua clinica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      // Extensões de navegador (tradutores, etc.) injetam atributos no <html>
      // antes da hidratação — isso é esperado e inofensivo, não um bug nosso.
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        spaceGrotesk.variable,
        geistMono.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
