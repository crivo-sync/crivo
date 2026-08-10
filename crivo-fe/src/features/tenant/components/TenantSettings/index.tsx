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
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";

import { ErrorServer } from "@/components/ui/error-server";

import { useIsAdmin } from "@/components/providers/session-provider";
import { MaskedTextField } from "@/components/masked-text-field";
import { PHONE_MASK } from "@/lib/br-masks";
import { useTenant } from "../../hooks/use-tenant";
import { useUpdateTenant } from "../../hooks/use-update-tenant";
import { updateTenantSchema, type UpdateTenantSchema } from "../../schemas/tenant";
import { BusinessDaysField } from "./business-days-field";
import { ColorField } from "./color-field";
import { LogoUpload } from "./logo-upload";

const DEFAULT_BUSINESS_HOURS_START = 480; // 08:00
const DEFAULT_BUSINESS_HOURS_END = 1080; // 18:00
const DEFAULT_BUSINESS_DAYS = [1, 2, 3, 4, 5]; // seg–sex

/** Minutos desde a meia-noite -> dayjs (a data é irrelevante, só a hora). */
const minutesToDayjs = (minutes: number | undefined) =>
  minutes == null
    ? null
    : dayjs().startOf("day").add(minutes, "minute");

/** dayjs -> minutos desde a meia-noite. */
const dayjsToMinutes = (value: dayjs.Dayjs) =>
  value.hour() * 60 + value.minute();

/**
 * A escolha tem consequência real e a tela precisa dizer qual: o não oficial
 * é mais barato mas arrisca o número da clínica, e "simulado" não envia nada
 * — quem marcar sem entender acha que avisou o paciente e não avisou.
 */
const PROVIDER_HINTS: Record<string, string> = {
  DEFAULT: "Usa a configuração padrão do sistema.",
  META: "Canal oficial do WhatsApp. Cobra por mensagem enviada e não corre risco de bloqueio.",
  EVOLUTION:
    "Mais barato, mas o WhatsApp não autoriza esse tipo de conexão — o número da clínica pode ser bloqueado em definitivo.",
  FAKE: "Nada é enviado de verdade. Use apenas para testes e demonstrações.",
};

const EMPTY_VALUES: UpdateTenantSchema = {
  name: "",
  primaryColor: "",
  secondaryColor: "",
  phone: "",
  email: "",
  address: "",
  aiMessagesEnabled: false,
  messagingProvider: "",
  businessHoursStart: DEFAULT_BUSINESS_HOURS_START,
  businessHoursEnd: DEFAULT_BUSINESS_HOURS_END,
  businessDays: DEFAULT_BUSINESS_DAYS,
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
      primaryColor: tenant.primaryColor ?? "",
      secondaryColor: tenant.secondaryColor ?? "",
      phone: tenant.phone ?? "",
      email: tenant.email ?? "",
      address: tenant.address ?? "",
      aiMessagesEnabled: tenant.aiMessagesEnabled,
      // `null` no banco = "padrão do sistema", que no select é a opção "".
      messagingProvider: tenant.messagingProvider ?? "",
      businessHoursStart:
        tenant.businessHoursStart ?? DEFAULT_BUSINESS_HOURS_START,
      businessHoursEnd: tenant.businessHoursEnd ?? DEFAULT_BUSINESS_HOURS_END,
      businessDays: tenant.businessDays ?? DEFAULT_BUSINESS_DAYS,
    });
  }, [tenant, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateTenant.mutateAsync({
        ...values,
        // "" é o "padrão do sistema" do select; o backend espera `null` para
        // voltar a herdar a configuração do servidor.
        messagingProvider: values.messagingProvider || null,
      });
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

          {/* Fora do formulário: o upload salva sozinho na hora (como o
              avatar), não faz parte do "Salvar alterações". */}
          <LogoUpload logoUrl={tenant.logoUrl} disabled={!canManage} />

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

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Horário de funcionamento
            </Typography>

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
                  name="businessHoursStart"
                  render={({ field, fieldState }) => (
                    <TimePicker
                      label="Abertura"
                      value={minutesToDayjs(field.value)}
                      // `onChange` dispara a cada tecla durante a digitação,
                      // com um dayjs inválido (não nulo) — sem o `isValid()`
                      // gravaríamos NaN no form.
                      onChange={(value) => {
                        if (value && !value.isValid()) return;
                        field.onChange(value ? dayjsToMinutes(value) : undefined);
                      }}
                      onAccept={field.onBlur}
                      disabled={!canManage}
                      ampm={false}
                      format="HH:mm"
                      slotProps={{
                        textField: {
                          id: "businessHoursStart",
                          fullWidth: true,
                          onBlur: field.onBlur,
                          error: !!fieldState.error,
                          helperText: fieldState.error?.message,
                        },
                      }}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="businessHoursEnd"
                  render={({ field, fieldState }) => (
                    <TimePicker
                      label="Fechamento"
                      value={minutesToDayjs(field.value)}
                      onChange={(value) => {
                        if (value && !value.isValid()) return;
                        field.onChange(value ? dayjsToMinutes(value) : undefined);
                      }}
                      onAccept={field.onBlur}
                      disabled={!canManage}
                      ampm={false}
                      format="HH:mm"
                      slotProps={{
                        textField: {
                          id: "businessHoursEnd",
                          fullWidth: true,
                          onBlur: field.onBlur,
                          error: !!fieldState.error,
                          helperText: fieldState.error?.message,
                        },
                      }}
                    />
                  )}
                />
              </Box>

              <Controller
                control={control}
                name="businessDays"
                render={({ field, fieldState }) => (
                  <BusinessDaysField
                    value={field.value ?? []}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={!canManage}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              Envio de WhatsApp
            </Typography>

            <Controller
              control={control}
              name="messagingProvider"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  select
                  id="messagingProvider"
                  label="Como as mensagens são enviadas"
                  value={field.value ?? ""}
                  disabled={!canManage}
                  error={!!fieldState.error}
                  helperText={
                    fieldState.error?.message ??
                    PROVIDER_HINTS[field.value || "DEFAULT"]
                  }
                >
                  {/* "" = herda o padrão do servidor. É o estado de quem
                      nunca escolheu, e precisa continuar alcançável para a
                      clínica poder voltar atrás. */}
                  <MenuItem value="">Padrão do sistema</MenuItem>
                  <MenuItem value="META">WhatsApp oficial (Meta)</MenuItem>
                  <MenuItem value="EVOLUTION">WhatsApp não oficial</MenuItem>
                  <MenuItem value="FAKE">Simulado (não envia)</MenuItem>
                </TextField>
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
