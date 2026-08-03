"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { ErrorServer } from "@/components/ui/error-server";

import { useIsAdmin } from "@/components/providers/session-provider";
import { MaskedTextField } from "@/components/masked-text-field";
import { PHONE_MASK } from "@/lib/br-masks";
import { useTenant } from "../../hooks/use-tenant";
import { useUpdateTenant } from "../../hooks/use-update-tenant";
import { updateTenantSchema, type UpdateTenantSchema } from "../../schemas/tenant";
import { ColorField } from "./color-field";

const EMPTY_VALUES: UpdateTenantSchema = {
  name: "",
  logoUrl: "",
  primaryColor: "",
  secondaryColor: "",
  phone: "",
  email: "",
  address: "",
  aiMessagesEnabled: false,
};

export const TenantSettings = () => {
  const canManage = useIsAdmin();
  const { tenant, isLoading, error, refetch } = useTenant();
  const updateTenant = useUpdateTenant();

  // `defaultValues` com strings vazias (não `{}`) — os campos controlados
  // (`TextField value={field.value}`) não podem começar `undefined` e virar
  // string depois: React avisa "uncontrolled to controlled input".
  const { control, handleSubmit, reset, formState } = useForm<UpdateTenantSchema>({
    resolver: zodResolver(updateTenantSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!tenant) return;
    reset({
      name: tenant.name,
      logoUrl: tenant.logoUrl ?? "",
      primaryColor: tenant.primaryColor ?? "",
      secondaryColor: tenant.secondaryColor ?? "",
      phone: tenant.phone ?? "",
      email: tenant.email ?? "",
      address: tenant.address ?? "",
      aiMessagesEnabled: tenant.aiMessagesEnabled,
    });
  }, [tenant, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateTenant.mutateAsync(values);
    } catch {
      // Erro já exibido pelo snackbar via onError do hook.
    }
  });

  if (error) {
    return (
      <ErrorServer message={error.message} onRetry={() => refetch()} />
    );
  }

  if (isLoading || !tenant) {
    return (
      <Card variant="outlined" sx={{ p: 3 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2.5,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={56} />
          ))}
        </Box>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ p: 3 }}>
      {!canManage && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Somente administradores podem editar os dados da clínica.
        </Alert>
      )}

      <form onSubmit={onSubmit}>
        <Stack spacing={2.5}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2.5,
            }}
          >
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  id="name"
                  label="Nome da clínica"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  disabled={!canManage}
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
                  id="tenant-email"
                  type="email"
                  label="E-mail de contato"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  disabled={!canManage}
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field, fieldState }) => (
                <MaskedTextField
                  {...field}
                  {...PHONE_MASK}
                  id="tenant-phone"
                  label="Telefone"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  disabled={!canManage}
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="address"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  id="address"
                  label="Endereço"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  disabled={!canManage}
                  fullWidth
                />
              )}
            />
          </Box>

          <Controller
            control={control}
            name="logoUrl"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                id="logoUrl"
                label="URL do logo"
                placeholder="https://…"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                disabled={!canManage}
                fullWidth
              />
            )}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2.5,
            }}
          >
            <Controller
              control={control}
              name="primaryColor"
              render={({ field, fieldState }) => (
                <ColorField
                  {...field}
                  value={field.value ?? ""}
                  id="primaryColor"
                  label="Cor primária"
                  placeholder="#4F46E5"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  disabled={!canManage}
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name="secondaryColor"
              render={({ field, fieldState }) => (
                <ColorField
                  {...field}
                  value={field.value ?? ""}
                  id="secondaryColor"
                  label="Cor secundária"
                  placeholder="#22D3EE"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  disabled={!canManage}
                  fullWidth
                />
              )}
            />
          </Box>

          <Controller
            control={control}
            name="aiMessagesEnabled"
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value ?? false}
                    onChange={(event) => field.onChange(event.target.checked)}
                    disabled={!canManage}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">
                      Reescrever mensagens com IA
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      DeepSeek deixa o texto do WhatsApp mais natural. Se
                      falhar, o envio cai para o modelo padrão.
                    </Typography>
                  </Box>
                }
              />
            )}
          />

          {canManage && (
            <Box>
              <Button
                type="submit"
                variant="contained"
                disabled={updateTenant.isPending || !formState.isDirty}
                startIcon={
                  updateTenant.isPending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : null
                }
              >
                Salvar alterações
              </Button>
            </Box>
          )}
        </Stack>
      </form>
    </Card>
  );
};
