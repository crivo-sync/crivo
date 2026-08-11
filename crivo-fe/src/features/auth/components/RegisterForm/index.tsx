"use client";

import { Controller } from "react-hook-form";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useRegister } from "../../hooks/use-register";

export const RegisterForm = () => {
  const {
    control,
    onSubmit,
    handleTenantNameChange,
    handleSubdomainChange,
    isSubmitting,
    serverError,
  } = useRegister();

  return (
    <Stack component="form" onSubmit={onSubmit} spacing={2.5}>
      <Controller
        control={control}
        name="tenantName"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            onChange={(event) => handleTenantNameChange(event.target.value)}
            id="tenantName"
            label="Nome da clínica"
            autoComplete="organization"
            placeholder="Clínica Sorriso"
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            fullWidth
          />
        )}
      />

      <Controller
        control={control}
        name="subdomain"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            onChange={(event) => handleSubdomainChange(event.target.value)}
            id="subdomain"
            label="Endereço da clínica"
            placeholder="clinica-sorriso"
            error={!!fieldState.error}
            helperText={
              fieldState.error?.message ??
              "Usado no link de agendamento online que você envia aos pacientes"
            }
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography variant="body2" color="text.secondary">
                      crivo.com.br/
                    </Typography>
                  </InputAdornment>
                ),
              },
            }}
            fullWidth
          />
        )}
      />

      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            id="name"
            label="Seu nome"
            autoComplete="name"
            placeholder="Maria Silva"
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            fullWidth
          />
        )}
      />

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
            autoComplete="new-password"
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
        Criar conta grátis
      </Button>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textAlign: "center" }}
      >
        Teste grátis por 14 dias. Sem cartão de crédito.
      </Typography>
    </Stack>
  );
};
