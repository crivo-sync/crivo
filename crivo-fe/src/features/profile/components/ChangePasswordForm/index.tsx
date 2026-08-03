"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { useChangePassword } from "../../hooks/use-change-password";
import {
  changePasswordSchema,
  type ChangePasswordSchema,
} from "../../schemas/profile";

const EMPTY_VALUES: ChangePasswordSchema = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export const ChangePasswordForm = () => {
  const changePassword = useChangePassword();

  const { control, handleSubmit, reset } = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY_VALUES,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset(EMPTY_VALUES);
    } catch {
      // Erro já exibido pelo snackbar via onError do hook.
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <Stack spacing={2.5}>
        <Controller
          control={control}
          name="currentPassword"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              id="currentPassword"
              type="password"
              label="Senha atual"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              fullWidth
            />
          )}
        />

        <Controller
          control={control}
          name="newPassword"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              id="newPassword"
              type="password"
              label="Nova senha"
              error={!!fieldState.error}
              helperText={fieldState.error?.message ?? "Ao menos 8 caracteres."}
              fullWidth
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              id="confirmPassword"
              type="password"
              label="Confirmar nova senha"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              fullWidth
            />
          )}
        />

        <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
          <Button
            type="submit"
            variant="contained"
            disabled={changePassword.isPending}
            startIcon={
              changePassword.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            Trocar senha
          </Button>
        </Stack>
      </Stack>
    </form>
  );
};
