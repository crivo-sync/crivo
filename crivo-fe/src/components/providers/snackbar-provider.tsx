"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Alert, { type AlertColor } from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

type SnackbarState = {
  open: boolean;
  message: string;
  severity: AlertColor;
};

type SnackbarContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
};

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

const INITIAL_STATE: SnackbarState = {
  open: false,
  message: "",
  severity: "success",
};

/**
 * Notificações globais do painel via Snackbar do MUI.
 *
 * Substitui o `sonner` (que segue disponível para o site institucional,
 * fora do escopo do admin).
 */
export const SnackbarProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<SnackbarState>(INITIAL_STATE);

  const show = useCallback((message: string, severity: AlertColor) => {
    setState({ open: true, message, severity });
  }, []);

  const value = useMemo<SnackbarContextValue>(
    () => ({
      showSuccess: (message) => show(message, "success"),
      showError: (message) => show(message, "error"),
      showInfo: (message) => show(message, "info"),
    }),
    [show],
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={4000}
        onClose={() => setState((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={state.severity}
          variant="filled"
          onClose={() => setState((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {state.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export function useSnackbar(): SnackbarContextValue {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar precisa estar dentro de <SnackbarProvider>.");
  }
  return context;
}
