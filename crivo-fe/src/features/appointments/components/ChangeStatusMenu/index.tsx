"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

import { useChangeAppointmentStatus } from "../../hooks/use-change-appointment-status";
import type { Appointment, AppointmentStatus } from "../../types";

type PendingChange = { appointment: Appointment; status: AppointmentStatus };

type ChangeStatusMenuProps = {
  pending?: PendingChange;
  onOpenChange: (open: boolean) => void;
};

/**
 * Dialog de confirmação só para o caso que precisa de dado extra
 * (cancelamento pede motivo). As demais transições disparam direto no
 * `getActions` da tabela, sem confirmação — são reversíveis o bastante
 * (o histórico de status fica visível na própria linha).
 */
export const ChangeStatusMenu = ({
  pending,
  onOpenChange,
}: ChangeStatusMenuProps) => {
  const changeStatus = useChangeAppointmentStatus();
  const [cancelReason, setCancelReason] = useState("");

  const handleConfirm = async () => {
    if (!pending) return;
    try {
      await changeStatus.mutateAsync({
        id: pending.appointment.id,
        input: { status: pending.status, cancelReason: cancelReason || undefined },
      });
      setCancelReason("");
      onOpenChange(false);
    } catch {
      // Erro já exibido pelo snackbar via onError do hook.
    }
  };

  return (
    <Dialog
      open={!!pending}
      onClose={() => onOpenChange(false)}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Cancelar agendamento</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Tem certeza que deseja cancelar o agendamento de{" "}
          <strong>{pending?.appointment.patient.name}</strong>?
        </DialogContentText>
        <TextField
          label="Motivo (opcional)"
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          placeholder="Paciente remarcou por telefone"
          fullWidth
          multiline
          minRows={2}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          color="inherit"
          onClick={() => onOpenChange(false)}
          disabled={changeStatus.isPending}
        >
          Voltar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={changeStatus.isPending}
          startIcon={
            changeStatus.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : null
          }
        >
          Cancelar agendamento
        </Button>
      </DialogActions>
    </Dialog>
  );
};
