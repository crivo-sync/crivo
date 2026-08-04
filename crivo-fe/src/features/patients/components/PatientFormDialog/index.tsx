"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import { MaskedTextField } from "@/components/masked-text-field";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { CPF_MASK, PHONE_MASK } from "@/lib/br-masks";
import { useCreatePatient } from "../../hooks/use-create-patient";
import { useUpdatePatient } from "../../hooks/use-update-patient";
import {
  createPatientSchema,
  type CreatePatientSchema,
} from "../../schemas/patient";
import type { Patient } from "../../types";

type PatientFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = modo edição; ausente = modo criação. */
  patient?: Patient;
};

const EMPTY_VALUES: CreatePatientSchema = {
  name: "",
  phone: "",
  cpf: "",
  email: "",
};

export const PatientFormDialog = ({
  open,
  onOpenChange,
  patient,
}: PatientFormDialogProps) => {
  const isEditing = !!patient;
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const isSubmitting = createPatient.isPending || updatePatient.isPending;

  const { control, handleSubmit, reset, formState } =
    useForm<CreatePatientSchema>({
      resolver: zodResolver(createPatientSchema),
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
      patient
        ? {
            name: patient.name,
            phone: patient.phone,
            cpf: patient.cpf ?? "",
            email: patient.email ?? "",
          }
        : EMPTY_VALUES,
    );
  }, [open, patient, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      ...values,
      cpf: values.cpf || undefined,
      email: values.email || undefined,
    };

    try {
      if (isEditing) {
        await updatePatient.mutateAsync({ id: patient.id, input });
      } else {
        await createPatient.mutateAsync(input);
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
            {isEditing ? "Editar paciente" : "Cadastrar paciente"}
          </DialogTitle>

          <DialogContent>
            <DialogContentText sx={{ mb: 3 }}>
              {isEditing
                ? "Atualize os dados do paciente."
                : "Preencha os dados do novo paciente."}
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

              <Controller
                control={control}
                name="phone"
                render={({ field, fieldState }) => (
                  <MaskedTextField
                    {...field}
                    {...PHONE_MASK}
                    id="phone"
                    label="Telefone (com DDD)"
                    placeholder="(11) 98765-4321"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />

              <Stack direction="row" spacing={2.5}>
                <Controller
                  control={control}
                  name="cpf"
                  render={({ field, fieldState }) => (
                    <MaskedTextField
                      {...field}
                      id="cpf"
                      label="CPF (opcional)"
                      placeholder="000.000.000-00"
                      mask={CPF_MASK}
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
