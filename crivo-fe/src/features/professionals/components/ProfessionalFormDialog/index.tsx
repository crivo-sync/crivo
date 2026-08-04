"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Autocomplete from "@mui/material/Autocomplete";
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

import { MaskedTextField } from "@/components/masked-text-field";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { PHONE_MASK } from "@/lib/br-masks";
import { getProceduresAction } from "@/features/procedures/actions/get-procedures-action";
import { useCreateProfessional } from "../../hooks/use-create-professional";
import { useUpdateProfessional } from "../../hooks/use-update-professional";
import {
  professionalFormSchema,
  type ProfessionalFormSchema,
} from "../../schemas/professional";
import type { Professional } from "../../types";

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
  const isSubmitting =
    createProfessional.isPending || updateProfessional.isPending;

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
      isDirty: formState.isDirty,
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
        await createProfessional.mutateAsync(base);
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
              disabled={isSubmitting}
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
