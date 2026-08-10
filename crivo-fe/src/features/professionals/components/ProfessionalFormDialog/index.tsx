"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { MaskedTextField } from "@/components/masked-text-field";
import { useSnackbar } from "@/components/providers/snackbar-provider";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { PHONE_MASK } from "@/lib/br-masks";
import { getProceduresAction } from "@/features/procedures/actions/get-procedures-action";
import { putScheduleAction } from "../../actions/schedule-actions";
import { useCreateProfessional } from "../../hooks/use-create-professional";
import { SCHEDULE_QUERY_KEY } from "../../hooks/use-schedule";
import { useUpdateProfessional } from "../../hooks/use-update-professional";
import {
  professionalFormSchema,
  type ProfessionalFormSchema,
} from "../../schemas/professional";
import type { Professional, ScheduleWindow } from "../../types";
import {
  hasInvalidWindow,
  WeeklyGridEditor,
} from "../ScheduleDialog/weekly-grid-editor";
import { useTenant } from "@/features/tenant/hooks/use-tenant";

type ProfessionalFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = modo edição; ausente = modo criação. */
  professional?: Professional;
};

const EMPTY_VALUES: ProfessionalFormSchema = {
  name: "",
  specialty: "",
  councilCode: "",
  phone: "",
  email: "",
  isActive: true,
  procedureIds: [],
};

export const ProfessionalFormDialog = ({
  open,
  onOpenChange,
  professional,
}: ProfessionalFormDialogProps) => {
  const isEditing = !!professional;
  const createProfessional = useCreateProfessional();
  const updateProfessional = useUpdateProfessional();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const { tenant } = useTenant();

  /**
   * A grade fica em memória durante o cadastro porque as faixas pertencem a
   * um profissional que ainda não existe — só há `professionalId` para
   * gravar depois que a criação responde.
   *
   * Vazia é um estado válido, não um formulário incompleto: sem faixas o
   * backend libera o expediente inteiro da clínica, que é o padrão certo
   * para quem só quer cadastrar alguém rápido.
   *
   * Nasce vazia a cada abertura porque `ProfessionalManagement` remonta este
   * dialog por `key` — não há efeito de limpeza para manter em sincronia.
   */
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleWindow[]>([]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const isSubmitting =
    createProfessional.isPending ||
    updateProfessional.isPending ||
    isSavingSchedule;

  const { data: procedures = [], isLoading: isLoadingProcedures } = useQuery({
    queryKey: ["professional-form", "procedures"],
    queryFn: async () => {
      const result = await getProceduresAction({ page: 1, perPage: 100 });
      if (!result.success) throw new Error(result.message);
      return result.data.data.filter((procedure) => procedure.isActive);
    },
  });

  const { control, handleSubmit, reset, formState } =
    useForm<ProfessionalFormSchema>({
      resolver: zodResolver(professionalFormSchema),
      defaultValues: EMPTY_VALUES,
    });

  const { requestClose, isConfirmOpen, confirmDiscard, cancelDiscard } =
    useUnsavedChangesGuard({
      // A grade vive fora do react-hook-form, então `formState.isDirty` não a
      // enxerga: sem somar isso, fechar depois de montar a semana inteira
      // descartaria tudo sem perguntar.
      isDirty: formState.isDirty || scheduleDraft.length > 0,
      onConfirmClose: () => onOpenChange(false),
    });

  useEffect(() => {
    if (!open) return;
    reset(
      professional
        ? {
            name: professional.name,
            specialty: professional.specialty ?? "",
            councilCode: professional.councilCode ?? "",
            phone: professional.phone ?? "",
            email: professional.email ?? "",
            isActive: professional.isActive,
            procedureIds: professional.procedures.map((p) => p.id),
          }
        : EMPTY_VALUES,
    );
  }, [open, professional, reset]);

  const onSubmit = handleSubmit(async ({ isActive, ...values }) => {
    // Campos opcionais vazios não devem ir como "" para a API.
    const base = {
      name: values.name,
      specialty: values.specialty || undefined,
      councilCode: values.councilCode || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
      procedureIds: values.procedureIds,
    };

    try {
      if (isEditing) {
        // `isActive` só existe no UpdateProfessionalDto, não no cadastro.
        await updateProfessional.mutateAsync({
          id: professional.id,
          input: { ...base, isActive },
        });
      } else {
        const created = await createProfessional.mutateAsync(base);

        // Segundo passo: a grade só pode ser gravada agora, com o id em mãos.
        // Uma falha aqui não desfaz o cadastro — o profissional existe e é
        // utilizável (atende o expediente da clínica), então o certo é dizer
        // o que ficou faltando em vez de fingir que nada foi salvo.
        if (scheduleDraft.length > 0) {
          setIsSavingSchedule(true);
          try {
            const result = await putScheduleAction(created.id, scheduleDraft);
            if (!result.success) throw new Error(result.message);

            queryClient.invalidateQueries({
              queryKey: [...SCHEDULE_QUERY_KEY, created.id],
            });
          } catch (error) {
            snackbar.showError(
              `Profissional cadastrado, mas os horários não foram salvos: ${
                error instanceof Error ? error.message : "erro inesperado"
              }. Ajuste em Horários e bloqueios.`,
            );
          } finally {
            setIsSavingSchedule(false);
          }
        }
      }
      onOpenChange(false);
    } catch {
      // Erro já exibido pelo snackbar via onError do hook.
    }
  });

  return (
    <>
      <Dialog open={open} onClose={requestClose} fullWidth maxWidth="sm">
        <form onSubmit={onSubmit}>
          <DialogTitle>
            {isEditing ? "Editar profissional" : "Cadastrar profissional"}
          </DialogTitle>

          <DialogContent>
            <DialogContentText sx={{ mb: 3 }}>
              {isEditing
                ? "Atualize os dados do profissional."
                : "Preencha os dados do novo profissional."}
            </DialogContentText>

            <Stack spacing={2.5}>
              <Controller
                control={control}
                name="name"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    id="name"
                    label="Nome"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />

              <Stack direction="row" spacing={2.5}>
                <Controller
                  control={control}
                  name="specialty"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      id="specialty"
                      label="Especialidade (opcional)"
                      placeholder="Ortodontia"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="councilCode"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      id="councilCode"
                      label="Registro (opcional)"
                      placeholder="CRO-SP 12345"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
              </Stack>

              <Stack direction="row" spacing={2.5}>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field, fieldState }) => (
                    <MaskedTextField
                      {...field}
                      {...PHONE_MASK}
                      id="phone"
                      label="Telefone (opcional)"
                      placeholder="(11) 98765-4321"
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
                      label="E-mail (opcional)"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                />
              </Stack>

              <Controller
                control={control}
                name="procedureIds"
                render={({ field, fieldState }) => (
                  <Autocomplete
                    multiple
                    id="procedureIds"
                    options={procedures}
                    getOptionLabel={(procedure) => procedure.name}
                    isOptionEqualToValue={(option, val) => option.id === val.id}
                    value={procedures.filter((procedure) =>
                      field.value.includes(procedure.id),
                    )}
                    onChange={(_, selected) =>
                      field.onChange(selected.map((procedure) => procedure.id))
                    }
                    onBlur={field.onBlur}
                    loading={isLoadingProcedures}
                    noOptionsText="Nenhum procedimento cadastrado"
                    loadingText="Carregando…"
                    renderValue={(selected, getItemProps) =>
                      selected.map((procedure, index) => (
                        <Chip
                          {...getItemProps({ index })}
                          key={procedure.id}
                          label={procedure.name}
                          size="small"
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Procedimentos que realiza (opcional)"
                        placeholder={
                          field.value.length ? undefined : "Todos os procedimentos"
                        }
                        error={!!fieldState.error}
                        helperText={
                          fieldState.error?.message ??
                          "Deixe vazio para liberar todos os procedimentos."
                        }
                      />
                    )}
                  />
                )}
              />

              {/* Só no cadastro: na edição, a grade é editada em "Horários e
                  bloqueios", que salva direto e ainda traz os bloqueios. */}
              {!isEditing && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Horários de atendimento (opcional)
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block", mb: 1.5 }}
                  >
                    Deixe vazio para atender em todo o expediente da clínica.
                    Mais de uma faixa no mesmo dia cobre intervalo de almoço.
                    Bloqueios de datas (férias) são definidos depois, em
                    Horários e bloqueios.
                  </Typography>
                  <WeeklyGridEditor
                    value={scheduleDraft}
                    onChange={setScheduleDraft}
                    clinicHours={tenant}
                  />
                </Box>
              )}

              {isEditing && (
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(event) =>
                            field.onChange(event.target.checked)
                          }
                        />
                      }
                      label="Profissional ativo"
                    />
                  )}
                />
              )}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              type="button"
              color="inherit"
              onClick={requestClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              // Grade inválida só voltaria como 400 no segundo passo, depois
              // de o profissional já ter sido criado.
              disabled={isSubmitting || hasInvalidWindow(scheduleDraft)}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
            >
              {isEditing ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <UnsavedChangesDialog
        open={isConfirmOpen}
        onDiscard={confirmDiscard}
        onKeepEditing={cancelDiscard}
      />
    </>
  );
};
