"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { type Dayjs } from "dayjs";

import { EntityAutocomplete } from "@/components/entity-autocomplete";
import { useAppointmentFormOptions } from "@/features/appointments/hooks/use-appointment-form-options";
import { useAddToWaitlist } from "../../hooks/use-waitlist";

type AddToWaitlistDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const AddToWaitlistDialog = ({
  open,
  onOpenChange,
}: AddToWaitlistDialogProps) => {
  const { patients, professionals, procedures, isLoading } =
    useAppointmentFormOptions();
  const addToWaitlist = useAddToWaitlist();

  const [patientId, setPatientId] = useState("");
  const [procedureId, setProcedureId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [preferredFrom, setPreferredFrom] = useState<Dayjs | null>(null);
  const [preferredTo, setPreferredTo] = useState<Dayjs | null>(null);
  const [notes, setNotes] = useState("");

  // `isValid()` porque durante a digitação o valor é um Dayjs inválido (não
  // `null`) — chamar `.toISOString()` nele lança RangeError.
  const invertedRange =
    !!preferredFrom?.isValid() &&
    !!preferredTo?.isValid() &&
    preferredTo.isBefore(preferredFrom);

  const canSubmit =
    !!patientId && !!procedureId && !invertedRange && !addToWaitlist.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;

    addToWaitlist.mutate(
      {
        patientId,
        procedureId,
        professionalId: professionalId || undefined,
        preferredFrom: preferredFrom?.isValid()
          ? preferredFrom.startOf("day").toISOString()
          : undefined,
        preferredTo: preferredTo?.isValid()
          ? preferredTo.endOf("day").toISOString()
          : undefined,
        notes: notes.trim() || undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Adicionar à lista de espera</DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          Quando abrir uma vaga que sirva para este paciente, ele aparece como
          sugestão para a recepção avisar.
        </DialogContentText>

        <Stack spacing={2.5}>
          <EntityAutocomplete
            id="waitlist-patient"
            label="Paciente"
            options={patients}
            getOptionLabel={(patient) => patient.name}
            value={patientId}
            onChange={setPatientId}
            loading={isLoading}
          />

          <EntityAutocomplete
            id="waitlist-procedure"
            label="Procedimento"
            options={procedures}
            getOptionLabel={(procedure) => procedure.name}
            value={procedureId}
            onChange={setProcedureId}
            loading={isLoading}
          />

          <EntityAutocomplete
            id="waitlist-professional"
            label="Profissional (opcional)"
            options={professionals}
            getOptionLabel={(professional) => professional.name}
            value={professionalId}
            onChange={setProfessionalId}
            loading={isLoading}
            helperText="Deixe vazio para aceitar qualquer profissional — aumenta a chance de encaixe."
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <DatePicker
              label="Aceita a partir de (opcional)"
              value={preferredFrom}
              onChange={setPreferredFrom}
              disablePast
              format="DD/MM/YYYY"
              slotProps={{ textField: { fullWidth: true } }}
            />
            <DatePicker
              label="Até (opcional)"
              value={preferredTo}
              onChange={setPreferredTo}
              disablePast
              minDate={preferredFrom?.isValid() ? preferredFrom : undefined}
              format="DD/MM/YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: invertedRange,
                  helperText: invertedRange
                    ? "O fim precisa ser depois do início."
                    : undefined,
                },
              }}
            />
          </Stack>

          <TextField
            label="Observações (opcional)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Só de manhã; avisar pelo telefone fixo"
            multiline
            minRows={2}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          type="button"
          color="inherit"
          onClick={() => onOpenChange(false)}
          disabled={addToWaitlist.isPending}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit}
          startIcon={
            addToWaitlist.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : null
          }
        >
          Adicionar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
