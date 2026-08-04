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

import { EntityAutocomplete } from "@/components/entity-autocomplete";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { formatDuration } from "@/lib/duration";
import { useTenant } from "@/features/tenant/hooks/use-tenant";
import { SlotPicker } from "../SlotPicker";
import { useAppointmentFormOptions } from "../../hooks/use-appointment-form-options";
import { useRescheduleAppointment } from "../../hooks/use-reschedule-appointment";
import {
  rescheduleAppointmentSchema,
  type RescheduleAppointmentSchema,
} from "../../schemas/appointment";
import type { Appointment } from "../../types";

type RescheduleAppointmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment;
};

export const RescheduleAppointmentDialog = ({
  open,
  onOpenChange,
  appointment,
}: RescheduleAppointmentDialogProps) => {
  const reschedule = useRescheduleAppointment();
  const { professionals } = useAppointmentFormOptions();
  const { tenant } = useTenant();

  const { control, handleSubmit, reset, watch, formState } =
    useForm<RescheduleAppointmentSchema>({
      resolver: zodResolver(rescheduleAppointmentSchema),
      defaultValues: { startsAt: "", professionalId: "", notes: "" },
    });

  const { requestClose, isConfirmOpen, confirmDiscard, cancelDiscard } =
    useUnsavedChangesGuard({
      isDirty: formState.isDirty,
      onConfirmClose: () => onOpenChange(false),
    });

  useEffect(() => {
    if (!open || !appointment) return;
    reset({
      startsAt: appointment.startsAt,
      professionalId: appointment.professional.id,
      notes: appointment.notes ?? "",
    });
  }, [open, appointment, reset]);

  const selectedProfessionalId = watch("professionalId");

  const onSubmit = handleSubmit(async (values) => {
    if (!appointment) return;

    try {
      await reschedule.mutateAsync({
        id: appointment.id,
        input: {
          startsAt: new Date(values.startsAt).toISOString(),
          professionalId: values.professionalId || undefined,
          notes: values.notes || undefined,
        },
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
          <DialogTitle>Reagendar</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 3 }}>
              Novo horário para {appointment?.patient.name}. A duração continua
              a do procedimento (
              {appointment && formatDuration(appointment.procedure.durationMinutes)}
              ).
            </DialogContentText>

            <Stack spacing={2.5}>
              <Controller
                control={control}
                name="startsAt"
                render={({ field, fieldState }) => (
                  <SlotPicker
                    professionalId={selectedProfessionalId || undefined}
                    procedureId={appointment?.procedure.id}
                    value={field.value}
                    onChange={field.onChange}
                    excludeAppointmentId={appointment?.id}
                    errorMessage={fieldState.error?.message}
                    businessDays={tenant?.businessDays}
                    businessHoursEnd={tenant?.businessHoursEnd}
                    procedureDurationMinutes={
                      appointment?.procedure.durationMinutes
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="professionalId"
                render={({ field, fieldState }) => (
                  <EntityAutocomplete
                    id="reschedule-professionalId"
                    label="Profissional"
                    options={professionals}
                    getOptionLabel={(professional) => professional.name}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="notes"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    id="reschedule-notes"
                    label="Observações (opcional)"
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
              disabled={reschedule.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={reschedule.isPending}
              startIcon={
                reschedule.isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
            >
              Reagendar
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
