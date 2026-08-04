"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

type UnsavedChangesDialogProps = {
  open: boolean;
  /** Descarta o que foi digitado e fecha o formulário. */
  onDiscard: () => void;
  /** Volta para o formulário, mantendo o que foi digitado. */
  onKeepEditing: () => void;
};

/**
 * Confirmação exibida quando o usuário tenta sair de um formulário com
 * alterações não salvas. Par visual do `useUnsavedChangesGuard`.
 */
export const UnsavedChangesDialog = ({
  open,
  onDiscard,
  onKeepEditing,
}: UnsavedChangesDialogProps) => {
  return (
    <Dialog open={open} onClose={onKeepEditing} maxWidth="xs" fullWidth>
      <DialogTitle>Descartar alterações?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Você tem alterações que ainda não foram salvas. Se sair agora, elas
          serão perdidas.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="inherit" onClick={onKeepEditing}>
          Continuar editando
        </Button>
        <Button color="error" variant="contained" onClick={onDiscard}>
          Descartar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
