"use client";

import { useEffect, useMemo } from "react";
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

import { EntityAutocomplete } from "@/components/entity-autocomplete";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { formatCentsToBRL } from "@/lib/currency";
import { formatDuration } from "@/lib/duration";
import { useTenant } from "@/features/tenant/hooks/use-tenant";
import { SlotPicker } from "../SlotPicker";
import { useAppointmentFormOptions } from "../../hooks/use-appointment-form-options";
import { useCreateAppointment } from "../../hooks/use-create-appointment";
import {
  createAppointmentSchema,
  type CreateAppointmentSchema,
} from "../../schemas/appointment";

type AppointmentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const EMPTY_VALUES: CreateAppointmentSchema = {
  patientId: "",
  professionalId: "",
  procedureId: "",
  startsAt: "",
  notes: "",
};

export const AppointmentFormDialog = ({
  open,
  onOpenChange,
}: AppointmentFormDialogProps) => {
  const createAppointment = useCreateAppointment();
  const { patients, professionals, procedures, isLoading } =
    useAppointmentFormOptions();
  const { tenant } = useTenant();

  const { control, handleSubmit, reset, watch, setValue, formState } =
    useForm<CreateAppointmentSchema>({
      resolver: zodResolver(createAppointmentSchema),
      defaultValues: EMPTY_VALUES,
    });

  const { requestClose, isConfirmOpen, confirmDiscard, cancelDiscard } =
    useUnsavedChangesGuard({
      isDirty: formState.isDirty,
      onConfirmClose: () => onOpenChange(false),
    });

  useEffect(() => {
    if (open) reset(EMPTY_VALUES);
  }, [open, reset]);

  const selectedProfessionalId = watch("professionalId");
  const selectedProcedureId = watch("procedureId");

  const selectedProfessional = professionals.find(
    (professional) => professional.id === selectedProfessionalId,
  );

  // Sem procedimentos marcados = profissional sem restrição, faz qualquer um.
  const availableProcedures = useMemo(() => {
    if (!selectedProfessional || selectedProfessional.procedures.length === 0) {
      return procedures;
    }
    const allowedIds = new Set(
      selectedProfessional.procedures.map((procedure) => procedure.id),
    );
    return procedures.filter((procedure) => allowedIds.has(procedure.id));
  }, [procedures, selectedProfessional]);

  const selectedProcedure = availableProcedures.find(
    (procedure) => procedure.id === selectedProcedureId,
  );

  // Trocar de profissional pode tirar o procedimento já escolhido da lista
  // permitida — sem isso ficaria um valor "fantasma" que não aparece mais
  // nas opções, mas continua marcado no form.
  useEffect(() => {
    if (!selectedProcedureId) return;
    const stillAllowed = availableProcedures.some(
      (procedure) => procedure.id === selectedProcedureId,
    );
    if (stillAllowed) return;
    setValue("procedureId", "", { shouldDirty: true });
    setValue("startsAt", "");
  }, [availableProcedures, selectedProcedureId, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createAppointment.mutateAsync({
        patientId: values.patientId,
        professionalId: values.professionalId,
        procedureId: values.procedureId,
        startsAt: new Date(values.startsAt).toISOString(),
        notes: values.notes || undefined,
      });
      onOpenChange(false);
    } catch {
      // Erro já exibido pelo snackbar via onError do hook; mantém o dialog
      // aberto para o usuário corrigir (ex.: conflito de horário).
    }
  });

  return (
    <>
      <Dialog open={open} onClose={requestClose} fullWidth maxWidth="sm">
        <form onSubmit={onSubmit}>
          <DialogTitle>Novo agendamento</DialogTitle>

          <DialogContent>
            <DialogContentText sx={{ mb: 3 }}>
              Duração e preço são definidos pelo procedimento escolhido.
            </DialogContentText>

            <Stack spacing={2.5}>
              <Controller
                control={control}
                name="patientId"
                render={({ field, fieldState }) => (
                  <EntityAutocomplete
                    id="patientId"
                    label="Paciente"
                    options={patients}
                    getOptionLabel={(patient) => patient.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    loading={isLoading}
                  />
                )}
              />

              <Controller
                control={control}
                name="professionalId"
                render={({ field, fieldState }) => (
                  <EntityAutocomplete
                    id="professionalId"
                    label="Profissional"
                    options={professionals}
                    getOptionLabel={(professional) => professional.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    loading={isLoading}
                  />
                )}
              />

              <Controller
                control={control}
                name="procedureId"
                render={({ field, fieldState }) => (
                  <EntityAutocomplete
                    id="procedureId"
                    label="Procedimento"
                    options={availableProcedures}
                    getOptionLabel={(procedure) => procedure.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={!!fieldState.error}
                    helperText={
                      fieldState.error?.message ??
                      (selectedProcedure &&
                        `${formatDuration(selectedProcedure.durationMinutes)} · ${formatCentsToBRL(selectedProcedure.priceInCents)}`) ??
                      (selectedProfessional &&
                        selectedProfessional.procedures.length > 0 &&
                        "Mostrando só os procedimentos que este profissional realiza.")
                    }
                    loading={isLoading}
                  />
                )}
              />

              <Controller
                control={control}
                name="startsAt"
                render={({ field, fieldState }) => (
                  <SlotPicker
                    professionalId={selectedProfessionalId || undefined}
                    procedureId={selectedProcedureId || undefined}
                    value={field.value}
                    onChange={field.onChange}
                    errorMessage={fieldState.error?.message}
                    businessDays={tenant?.businessDays}
                  />
                )}
              />

              <Controller
                control={control}
                name="notes"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    id="notes"
                    label="Observações (opcional)"
                    placeholder="Paciente pediu anestesia."
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    multiline
                    minRows={2}
                    fullWidth
                  />
                )}
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              type="button"
              color="inherit"
              onClick={requestClose}
              disabled={createAppointment.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createAppointment.isPending}
              startIcon={
                createAppointment.isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
            >
              Agendar
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
