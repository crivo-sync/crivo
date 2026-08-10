"use client";

import { createTheme } from "@mui/material/styles";
import { ptBR as corePtBR } from "@mui/material/locale";
import { ptBR as dataGridPtBR } from "@mui/x-data-grid/locales";
// Só tipos: registra `MuiPickersTextField` no `Components` do theme do MUI
// core, senão o TS não reconhece a chave abaixo.
import type {} from "@mui/x-date-pickers/themeAugmentation";

/**
 * Theme do painel administrativo.
 *
 * Escopo: só o admin (`(dashboard)` e `(auth)`). O site institucional
 * (`(website)`) continua em Tailwind puro e não passa por este provider.
 *
 * A paleta espelha o índigo da marca já usado no logo e no site, para que
 * admin e site não pareçam dois produtos diferentes.
 */
export const muiTheme = createTheme(
  {
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
    components: {
      // "small" em todo lugar por padrão — antes cada tela repetia
      // `size="small"` (ou esquecia, como o campo de busca de Pacientes, que
      // ficava maior que o botão "Novo paciente" ao lado). Centralizando
      // aqui, ajustar a altura dos campos do painel inteiro é uma linha só.
      MuiTextField: {
        defaultProps: { size: "small", fullWidth: true },
      },
      // O DatePicker/DateField não usa MuiTextField por baixo — é um
      // componente próprio (`PickersTextField`), então precisa do próprio
      // default para acompanhar o resto dos campos.
      MuiPickersTextField: {
        defaultProps: { size: "small", fullWidth: true },
      },
      /**
       * Cabeçalho do calendário: "seg", "ter", "qua"… em vez de "2ª", "3ª".
       *
       * O `weekdaysMin` do dayjs pt-br é `["Do","2ª","3ª","4ª","5ª","6ª","Sá"]`,
       * e o MUI renderiza isso como vem — o calendário mostrava "D 2 3 4 5 6 S",
       * que a recepção lê como número, não como dia da semana. Fica no tema
       * (e não em cada tela) para todo calendário do painel ficar igual.
       */
      MuiDateCalendar: {
        defaultProps: {
          // Indexado por `day()`: 0=domingo … 6=sábado.
          dayOfWeekFormatter: (date: { day: () => number }) =>
            ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"][date.day()],
        },
      },
    },
  },
  // Traduz os textos internos dos componentes (paginação do DataGrid,
  // aria-labels, etc.) — o resto da UI já é escrito em português.
  corePtBR,
  dataGridPtBR,
);
