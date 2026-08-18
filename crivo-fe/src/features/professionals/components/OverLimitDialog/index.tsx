"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";

import { useProfessionals } from "../../hooks/use-professionals";
import { useResolveOverLimit } from "../../hooks/use-over-limit";
import type { OverLimitStatus } from "../../types";

type OverLimitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: OverLimitStatus;
};

/**
 * "Seu plano permite N, você tem M — escolha quem continua ativo."
 *
 * A clínica escolhe **quem fica**, e não quem sai: marcar para manter é a
 * leitura otimista da lista (é a equipe dela), e evita que uma desmarcação
 * distraída desative alguém sem querer. O botão só libera com a seleção
 * exata do teto, então não dá para sair daqui ainda acima do limite.
 *
 * Diz explicitamente que ninguém é apagado. Sem isso a tela lê como
 * "escolha quem eu vou demitir", e a clínica trava com medo de perder
 * agenda e histórico — que continuam salvos, prontos para quando ela subir
 * de plano.
 */
export const OverLimitDialog = ({
  open,
  onOpenChange,
  status,
}: OverLimitDialogProps) => {
  const resolveOverLimit = useResolveOverLimit();
  const limite = status.maxProfessionals ?? 0;

  /**
   * Busca própria, **sem paginação nem filtro de busca**: a escolha precisa
   * ser entre a equipe inteira. Reaproveitar a lista da tela deixaria de
   * fora quem está na página 2 (ou quem não bate com a busca digitada), e a
   * clínica escolheria entre um subconjunto sem perceber.
   */
  const { professionals, isLoading } = useProfessionals({
    page: 1,
    perPage: 100,
  });

  const ativos = professionals.filter((professional) => professional.isActive);

  const [keepIds, setKeepIds] = useState<string[]>([]);

  const toggle = (id: string) => {
    setKeepIds((atual) =>
      atual.includes(id)
        ? atual.filter((mantido) => mantido !== id)
        : // Trava na seleção do teto: passar disso só levaria a um 400 do
          // backend, e a clínica não teria como saber qual desmarcar.
          atual.length >= limite
          ? atual
          : [...atual, id],
    );
  };

  const handleConfirm = async () => {
    try {
      await resolveOverLimit.mutateAsync(keepIds);
      onOpenChange(false);
    } catch {
      // Erro já exibido pelo snackbar via onError do hook.
    }
  };

  const faltam = limite - keepIds.length;

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Escolha quem continua ativo</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          <Typography variant="body2" sx={{ mb: 2 }}>
            Sua clínica tem <strong>{status.activeCount} profissionais</strong>{" "}
            ativos, e o plano {status.planName ?? "atual"} inclui{" "}
            <strong>{limite}</strong>. Marque quem continua atendendo.
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            Quem não for marcado fica <strong>desativado, não apagado</strong>:
            agenda, histórico e prontuário continuam salvos. Se você subir de
            plano depois, é só reativar.
          </Alert>
        </DialogContentText>

        {isLoading && (
          <Typography variant="body2" color="text.secondary">
            Carregando a equipe…
          </Typography>
        )}

        <List dense disablePadding>
          {ativos.map((professional) => {
            const marcado = keepIds.includes(professional.id);
            const bloqueado = !marcado && keepIds.length >= limite;

            return (
              <ListItemButton
                key={professional.id}
                onClick={() => toggle(professional.id)}
                disabled={bloqueado}
                dense
              >
                <Checkbox edge="start" checked={marcado} tabIndex={-1} />
                <ListItemText
                  primary={professional.name}
                  secondary={professional.specialty ?? undefined}
                />
              </ListItemButton>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          color="inherit"
          onClick={() => onOpenChange(false)}
          disabled={resolveOverLimit.isPending}
        >
          Agora não
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={faltam !== 0 || resolveOverLimit.isPending}
          startIcon={
            resolveOverLimit.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : null
          }
        >
          {faltam > 0
            ? `Escolha mais ${faltam}`
            : `Desativar ${ativos.length - keepIds.length}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
