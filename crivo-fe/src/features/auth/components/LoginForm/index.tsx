"use client";

import { Controller } from "react-hook-form";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { useLogin } from "../../hooks/use-login";

export const LoginForm = () => {
  const { control, onSubmit, isSubmitting, serverError } = useLogin();

  return (
    <Stack component="form" onSubmit={onSubmit} spacing={2.5}>
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            id="email"
            type="email"
            label="E-mail"
            autoComplete="email"
            placeholder="voce@clinica.com"
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            fullWidth
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            id="password"
            type="password"
            label="Senha"
            autoComplete="current-password"
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            fullWidth
          />
        )}
      />

      {serverError && <Alert severity="error">{serverError}</Alert>}

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isSubmitting}
        startIcon={
          isSubmitting ? <CircularProgress size={16} color="inherit" /> : null
        }
        fullWidth
      >
        Entrar
      </Button>
    </Stack>
  );
};
