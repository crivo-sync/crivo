"use client";

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import { useToggleUserActive } from "../../hooks/use-toggle-user-active";
import type { User } from "../../types";

type ToggleUserActiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
};

export const ToggleUserActiveDialog = ({
  open,
  onOpenChange,
  user,
}: ToggleUserActiveDialogProps) => {
  const toggleActive = useToggleUserActive();
  const willDeactivate = user?.isActive ?? true;

  const handleConfirm = async () => {
    if (!user) return;
    try {
      await toggleActive.mutateAsync({ id: user.id, isActive: !user.isActive });
      onOpenChange(false);
    } catch {
      // Erro já exibido pelo snackbar via onError do hook.
    }
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="xs" fullWidth>
      <DialogTitle>
        {willDeactivate ? "Desativar usuário" : "Reativar usuário"}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {willDeactivate ? (
            <>
              Tem certeza que deseja desativar <strong>{user?.name}</strong>?
              O login fica bloqueado até reativar — o histórico de ações
              dele (agendamentos criados, etc.) não é apagado.
            </>
          ) : (
            <>
              Tem certeza que deseja reativar <strong>{user?.name}</strong>?
              O login volta a funcionar imediatamente.
            </>
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          color="inherit"
          onClick={() => onOpenChange(false)}
          disabled={toggleActive.isPending}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          color={willDeactivate ? "error" : "primary"}
          onClick={handleConfirm}
          disabled={toggleActive.isPending}
          startIcon={
            toggleActive.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : null
          }
        >
          {willDeactivate ? "Desativar" : "Reativar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
