"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { useUpdateProfile } from "../../hooks/use-update-profile";
import { updateProfileSchema, type UpdateProfileSchema } from "../../schemas/profile";
import type { Profile } from "../../types";

type ProfileFormProps = {
  profile: Profile;
};

export const ProfileForm = ({ profile }: ProfileFormProps) => {
  const updateProfile = useUpdateProfile();

  const { control, handleSubmit, reset, formState } = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: profile.name },
  });

  useEffect(() => {
    reset({ name: profile.name });
  }, [profile.name, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateProfile.mutateAsync(values);
    } catch {
      // Erro já exibido pelo snackbar via onError do hook.
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <Stack spacing={2.5}>
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              id="profile-name"
              label="Nome"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              fullWidth
            />
          )}
        />

        <TextField
          id="profile-email"
          label="E-mail"
          value={profile.email}
          disabled
          fullWidth
          helperText="Trocar o e-mail ainda não está disponível."
        />

        <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
          <Button
            type="submit"
            variant="contained"
            disabled={updateProfile.isPending || !formState.isDirty}
            startIcon={
              updateProfile.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            Salvar
          </Button>
        </Stack>
      </Stack>
    </form>
  );
};
