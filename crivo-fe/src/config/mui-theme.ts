"use client";

import { createTheme } from "@mui/material/styles";
import { ptBR as corePtBR } from "@mui/material/locale";
import { ptBR as dataGridPtBR } from "@mui/x-data-grid/locales";

/**
 * Theme do painel administrativo.
 *
 * Escopo: só o admin (`(dashboard)` e `(auth)`). O site institucional
 * (`(website)`) continua em Tailwind puro e não passa por este provider.
 *
 * A paleta espelha o índigo da marca já usado no logo e no site, para que
 * admin e site não pareçam dois produtos diferentes.
 */
export const muiTheme = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      main: "#4f46e5", // indigo-600
      light: "#6366f1", // indigo-500
      dark: "#4338ca", // indigo-700
      contrastText: "#ffffff",
    },
    error: {
      main: "#dc2626", // red-600
    },
    success: {
      main: "#059669", // emerald-600
    },
    warning: {
      main: "#d97706", // amber-600
    },
    background: {
      default: "#f8fafc", // slate-50 — fundo da área de conteúdo
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a", // slate-900
      secondary: "#64748b", // slate-500
    },
    divider: "#e2e8f0", // slate-200
  },
  typography: {
    // Space Grotesk: mesma fonte do site institucional, carregada no layout
    // raiz via next/font e exposta em --font-sans.
    fontFamily: "var(--font-sans), system-ui, sans-serif",
    button: {
      textTransform: "none",
    },
  },
},
  // Traduz os textos internos dos componentes (paginação do DataGrid,
  // aria-labels, etc.) — o resto da UI já é escrito em português.
  corePtBR,
  dataGridPtBR,
);
