"use client";

import { useState } from "react";
import dayjs from "dayjs";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useAppointments } from "@/features/appointments/hooks/use-appointments";
import { useUploadClinicalPhoto } from "../../hooks/use-clinical-photos";
import type { ClinicalPhotoKind } from "../../types";

/** Mesmo limite do backend (`assertValidImageUpload`). */
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = "image/jpeg,image/png,image/webp";

export const UploadPhotoDialog = ({
  patientId,
  onClose,
}: {
  patientId: string;
  onClose: () => void;
}) => {
  const upload = useUploadClinicalPhoto(patientId);

  // Só os atendimentos deste paciente: a foto pertence a um deles, e é o que
  // dá data e procedimento à galeria.
  const { appointments, isLoading } = useAppointments({
    patientId,
    page: 1,
    perPage: 50,
  });

  const [appointmentId, setAppointmentId] = useState("");
  const [kind, setKind] = useState<ClinicalPhotoKind>("BEFORE");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>();

  const handleFile = (selected?: File) => {
    setFileError(undefined);

    if (!selected) {
      setFile(null);
      return;
    }

    // Valida antes de enviar: subir 5MB para receber 400 do backend gasta o
    // tempo da clínica e a franquia de rede dela.
    if (!ACCEPTED.split(",").includes(selected.type)) {
      setFileError("Envie uma imagem JPEG, PNG ou WebP.");
      setFile(null);
      return;
    }
    if (selected.size > MAX_BYTES) {
      setFileError("A imagem precisa ter até 5MB.");
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const canSubmit = !!file && !!appointmentId && !upload.isPending;

  const handleSubmit = async () => {
    if (!file || !appointmentId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("patientId", patientId);
    formData.append("appointmentId", appointmentId);
    formData.append("kind", kind);
    if (caption.trim()) formData.append("caption", caption.trim());

    try {
      await upload.mutateAsync(formData);
      onClose();
    } catch {
      // Snackbar do hook já mostrou; o dialog fica aberto para tentar de novo
      // sem reescolher o arquivo.
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Enviar foto</DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {!isLoading && appointments.length === 0 && (
            <Alert severity="info">
              A foto é vinculada a um atendimento, e este paciente ainda não
              tem nenhum. Marque a consulta primeiro.
            </Alert>
          )}

          <TextField
            select
            label="Atendimento"
            value={appointmentId}
            onChange={(event) => setAppointmentId(event.target.value)}
            disabled={isLoading || appointments.length === 0}
            helperText="A foto entra na galeria deste atendimento."
            fullWidth
          >
            {appointments.map((appointment) => (
              <MenuItem key={appointment.id} value={appointment.id}>
                {dayjs(appointment.startsAt).format("DD/MM/YYYY")} —{" "}
                {appointment.procedure?.name ?? "Procedimento"}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Momento"
            value={kind}
            onChange={(event) =>
              setKind(event.target.value as ClinicalPhotoKind)
            }
            fullWidth
          >
            <MenuItem value="BEFORE">Antes</MenuItem>
            <MenuItem value="AFTER">Depois</MenuItem>
          </TextField>

          <Box>
            <Button variant="outlined" component="label" fullWidth>
              {file ? file.name : "Escolher imagem"}
              <input
                type="file"
                accept={ACCEPTED}
                hidden
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </Button>
            <Typography
              variant="caption"
              sx={{
                mt: 0.5,
                display: "block",
                color: fileError ? "error.main" : "text.secondary",
              }}
            >
              {fileError ?? "JPEG, PNG ou WebP, até 5MB."}
            </Typography>
          </Box>

          <TextField
            label="Legenda (opcional)"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Ex.: após 2 sessões"
            slotProps={{ htmlInput: { maxLength: 200 } }}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={upload.isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {upload.isPending ? "Enviando…" : "Enviar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
