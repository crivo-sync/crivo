"use client";

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import { useDeletePatient } from "../../hooks/use-delete-patient";
import type { Patient } from "../../types";

type DeletePatientDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient;
};

export const DeletePatientDialog = ({
  open,
  onOpenChange,
  patient,
}: DeletePatientDialogProps) => {
  const deletePatient = useDeletePatient();

  const handleConfirm = async () => {
    if (!patient) return;
    await deletePatient.mutateAsync(patient.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="xs" fullWidth>
      <DialogTitle>Remover paciente</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Tem certeza que deseja remover{" "}
          <strong>{patient?.name}</strong>? Essa ação não pode ser desfeita.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          color="inherit"
          onClick={() => onOpenChange(false)}
          disabled={deletePatient.isPending}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={deletePatient.isPending}
          startIcon={
            deletePatient.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : null
          }
        >
          Remover
        </Button>
      </DialogActions>
    </Dialog>
  );
};
