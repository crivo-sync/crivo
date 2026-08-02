"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";

import { muiTheme } from "@/config/mui-theme";
import { SnackbarProvider } from "./snackbar-provider";

type MuiProviderProps = {
  children: React.ReactNode;
};

/**
 * Providers do Material UI para o painel administrativo.
 *
 * `enableCssLayer` coloca os estilos do MUI dentro de `@layer mui`, o que
 * mantém a precedência previsível caso alguma classe utilitária ainda
 * apareça no admin durante a migração — sem isso, o Tailwind (que também
 * usa layers) poderia sobrescrever o MUI de forma imprevisível.
 */
export const MuiProvider = ({ children }: MuiProviderProps) => {
  return (
    <AppRouterCacheProvider options={{ key: "mui", enableCssLayer: true }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <SnackbarProvider>{children}</SnackbarProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
};
