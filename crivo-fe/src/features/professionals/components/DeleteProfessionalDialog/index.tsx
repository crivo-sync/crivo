"use client";

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import { useDeleteProfessional } from "../../hooks/use-delete-professional";
import type { Professional } from "../../types";

type DeleteProfessionalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professional?: Professional;
};

export const DeleteProfessionalDialog = ({
  open,
  onOpenChange,
  professional,
}: DeleteProfessionalDialogProps) => {
  const deleteProfessional = useDeleteProfessional();

  const handleConfirm = async () => {
    if (!professional) return;
    try {
      await deleteProfessional.mutateAsync(professional.id);
      onOpenChange(false);
    } catch {
      // Erro já exibido pelo snackbar via onError do hook.
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Remover profissional</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Tem certeza que deseja remover{" "}
          <strong>{professional?.name}</strong>? Essa ação não pode ser
          desfeita.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          color="inherit"
          onClick={() => onOpenChange(false)}
          disabled={deleteProfessional.isPending}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={deleteProfessional.isPending}
          startIcon={
            deleteProfessional.isPending ? (
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
