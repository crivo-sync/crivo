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
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";

import { EntityAutocomplete } from "@/components/entity-autocomplete";
import {
  shouldDisableDate,
  shouldDisableTime,
  validateAppointmentStart,
} from "../../business-hours";
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
  const durationMinutes = appointment?.procedure.durationMinutes ?? 0;

  const { control, handleSubmit, reset, setError } =
    useForm<RescheduleAppointmentSchema>({
      resolver: zodResolver(rescheduleAppointmentSchema),
      defaultValues: { startsAt: "", professionalId: "", notes: "" },
    });

  useEffect(() => {
    if (!open || !appointment) return;
    reset({
      startsAt: appointment.startsAt,
      professionalId: appointment.professional.id,
      notes: appointment.notes ?? "",
    });
  }, [open, appointment, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!appointment) return;

    // Reforça a regra de negócio: início + duração precisa caber no horário
    // comercial, mesmo quando o horário é digitado manualmente.
    const startsAtError = validateAppointmentStart(
      values.startsAt,
      durationMinutes,
    );
    if (startsAtError) {
      setError("startsAt", { message: startsAtError });
      return;
    }

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
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      fullWidth
      maxWidth="sm"
    >
      <form onSubmit={onSubmit}>
        <DialogTitle>Reagendar</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Novo horário para {appointment?.patient.name}. A duração continua a
            do procedimento ({appointment?.procedure.durationMinutes} min).
          </DialogContentText>

          <Stack spacing={2.5}>
            <Controller
              control={control}
              name="startsAt"
              render={({ field, fieldState }) => (
                <DateTimePicker
                  label="Novo horário"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(date) =>
                    field.onChange(
                      date && date.isValid() ? date.toISOString() : "",
                    )
                  }
                  minDateTime={dayjs()}
                  shouldDisableDate={shouldDisableDate}
                  shouldDisableTime={(value, view) =>
                    shouldDisableTime(value, view, durationMinutes)
                  }
                  skipDisabled
                  ampm={false}
                  format="DD/MM/YYYY HH:mm"
                  slotProps={{
                    textField: {
                      id: "reschedule-startsAt",
                      fullWidth: true,
                      error: !!fieldState.error,
                      helperText: fieldState.error?.message,
                    },
                  }}
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
            onClick={() => onOpenChange(false)}
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
  );
};
