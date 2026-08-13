"use client";

import { useState } from "react";
import dayjs from "dayjs";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";

import { useDeleteClinicalPhoto } from "../../hooks/use-clinical-photos";
import type { ClinicalPhoto } from "../../types";

/**
 * Foto ampliada, com autoria e data.
 *
 * Sem botão de download de propósito: é dado sensível de saúde, e um botão
 * que salva no computador da recepção espalha a cópia para fora de qualquer
 * controle. Quem precisa da imagem usa a própria tela.
 */
export const PhotoLightbox = ({
  photo,
  patientId,
  onClose,
}: {
  photo: ClinicalPhoto;
  patientId: string;
  onClose: () => void;
}) => {
  const remove = useDeleteClinicalPhoto(patientId);
  const [confirming, setConfirming] = useState(false);

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent sx={{ p: 0, bgcolor: "black" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.caption ?? "Foto clínica"}
          style={{
            width: "100%",
            maxHeight: "70vh",
            objectFit: "contain",
            display: "block",
          }}
          // Reduz o caminho fácil de salvar. Não é proteção — quem quiser
          // consegue por outros meios —, mas evita o gesto acidental.
          onContextMenu={(event) => event.preventDefault()}
          draggable={false}
        />
      </DialogContent>

      <Stack spacing={0.5} sx={{ px: 3, pt: 2 }}>
        {photo.caption && (
          <Typography variant="body2">{photo.caption}</Typography>
        )}
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {photo.kind === "BEFORE" ? "Antes" : "Depois"} ·{" "}
          {dayjs(photo.createdAt).format("DD/MM/YYYY HH:mm")} · enviada por{" "}
          {photo.uploadedBy}
        </Typography>
      </Stack>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {confirming ? (
          <>
            <Typography
              variant="body2"
              sx={{ mr: "auto", color: "text.secondary" }}
            >
              Excluir esta foto?
            </Typography>
            <Button
              onClick={() => setConfirming(false)}
              color="inherit"
              disabled={remove.isPending}
            >
              Cancelar
            </Button>
            <Button
              color="error"
              variant="contained"
              disabled={remove.isPending}
              onClick={async () => {
                try {
                  await remove.mutateAsync(photo.id);
                  onClose();
                } catch {
                  // O snackbar do hook já mostrou o erro; o dialog continua
                  // aberto para a pessoa tentar de novo.
                }
              }}
            >
              {remove.isPending ? "Excluindo…" : "Excluir"}
            </Button>
          </>
        ) : (
          <>
            <Button
              startIcon={<DeleteIcon />}
              color="error"
              sx={{ mr: "auto" }}
              onClick={() => setConfirming(true)}
            >
              Excluir
            </Button>
            <Button onClick={onClose}>Fechar</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
