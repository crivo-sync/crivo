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
import { formatCentsToBRL } from "@/lib/currency";
import {
  shouldDisableDate,
  shouldDisableTime,
  validateAppointmentStart,
} from "../../business-hours";
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

  const { control, handleSubmit, reset, watch, setError } =
    useForm<CreateAppointmentSchema>({
      resolver: zodResolver(createAppointmentSchema),
      defaultValues: EMPTY_VALUES,
    });

  useEffect(() => {
    if (open) reset(EMPTY_VALUES);
  }, [open, reset]);

  const selectedProcedure = procedures.find(
    (procedure) => procedure.id === watch("procedureId"),
  );
  const durationMinutes = selectedProcedure?.durationMinutes ?? 0;

  const onSubmit = handleSubmit(async (values) => {
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
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      fullWidth
      maxWidth="sm"
    >
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
                  options={procedures}
                  getOptionLabel={(procedure) => procedure.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={!!fieldState.error}
                  helperText={
                    fieldState.error?.message ??
                    (selectedProcedure &&
                      `${selectedProcedure.durationMinutes} min · ${formatCentsToBRL(selectedProcedure.priceInCents)}`)
                  }
                  loading={isLoading}
                />
              )}
            />

            <Controller
              control={control}
              name="startsAt"
              render={({ field, fieldState }) => (
                <DateTimePicker
                  label="Data e hora"
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
                      id: "startsAt",
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
            onClick={() => onOpenChange(false)}
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
  );
};
