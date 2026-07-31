import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// Geist em tudo — body e headings — conforme o preset shadcn (--preset b1FSWjjrU).
const geistSans = Geist({
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
        geistSans.variable,
        geistMono.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
