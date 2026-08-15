"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";

import { ErrorServer } from "@/components/ui/error-server";
import { useClinicalPhotos } from "../../hooks/use-clinical-photos";
import type { ClinicalPhoto } from "../../types";
import { PhotoLightbox } from "./photo-lightbox";
import { UploadPhotoDialog } from "./upload-photo-dialog";

type Grupo = {
  appointmentId: string;
  startsAt: string;
  procedure: string;
  before: ClinicalPhoto[];
  after: ClinicalPhoto[];
};

/**
 * Galeria antes/depois, **agrupada por atendimento**.
 *
 * Uma grade cronológica solta mostraria as mesmas fotos, mas perderia o que
 * importa em estética: a comparação. Agrupar por atendimento põe o "antes" e
 * o "depois" lado a lado, com data e procedimento — que é como a clínica
 * mostra o resultado ao paciente.
 */
export const ClinicalPhotos = ({ patientId }: { patientId: string }) => {
  const { photos, isLoading, error, refetch } = useClinicalPhotos(patientId);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState<ClinicalPhoto | undefined>();

  const grupos = useMemo(() => {
    const porAtendimento = new Map<string, Grupo>();

    for (const photo of photos) {
      const atual = porAtendimento.get(photo.appointment.id) ?? {
        appointmentId: photo.appointment.id,
        startsAt: photo.appointment.startsAt,
        procedure: photo.appointment.procedure,
        before: [],
        after: [],
      };

      if (photo.kind === "BEFORE") atual.before.push(photo);
      else atual.after.push(photo);

      porAtendimento.set(photo.appointment.id, atual);
    }

    // Mais recente primeiro: o último resultado é o que a clínica mostra.
    return [...porAtendimento.values()].sort(
      (a, b) => dayjs(b.startsAt).valueOf() - dayjs(a.startsAt).valueOf(),
    );
  }, [photos]);

  if (error) {
    return <ErrorServer message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <Stack spacing={2.5} sx={{ py: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddPhotoAlternateIcon />}
          onClick={() => setUploadOpen(true)}
        >
          Enviar foto
        </Button>
      </Box>

      {isLoading ? (
        <Stack spacing={1.5}>
          {[0, 1].map((i) => (
            <Skeleton key={i} variant="rounded" height={150} />
          ))}
        </Stack>
      ) : grupos.length === 0 ? (
        <Alert severity="info">
          Nenhuma foto ainda. Envie o &quot;antes&quot; no dia do procedimento
          e o &quot;depois&quot; no retorno — a comparação fica lado a lado.
        </Alert>
      ) : (
        grupos.map((grupo) => (
          <Box key={grupo.appointmentId}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "baseline", mb: 1 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {dayjs(grupo.startsAt).format("DD/MM/YYYY")}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {grupo.procedure}
              </Typography>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <PhotoColumn
                label="Antes"
                photos={grupo.before}
                onOpen={setPreview}
              />
              <PhotoColumn
                label="Depois"
                photos={grupo.after}
                onOpen={setPreview}
              />
            </Box>
          </Box>
        ))
      )}

      {uploadOpen && (
        <UploadPhotoDialog
          patientId={patientId}
          onClose={() => setUploadOpen(false)}
        />
      )}

      {preview && (
        <PhotoLightbox
          photo={preview}
          patientId={patientId}
          onClose={() => setPreview(undefined)}
        />
      )}
    </Stack>
  );
};

const PhotoColumn = ({
  label,
  photos,
  onOpen,
}: {
  label: string;
  photos: ClinicalPhoto[];
  onOpen: (photo: ClinicalPhoto) => void;
}) => (
  <Box>
    <Chip
      label={label}
      size="small"
      color={label === "Antes" ? "default" : "primary"}
      variant="outlined"
      sx={{ mb: 1 }}
    />

    {photos.length === 0 ? (
      <Box
        sx={{
          height: 120,
          borderRadius: 2,
          border: "1px dashed",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Sem foto
        </Typography>
      </Box>
    ) : (
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {photos.map((photo) => (
          <Box
            key={photo.id}
            component="button"
            type="button"
            onClick={() => onOpen(photo)}
            aria-label={`Ampliar foto de ${label.toLowerCase()}`}
            sx={{
              p: 0,
              border: "none",
              borderRadius: 2,
              overflow: "hidden",
              cursor: "pointer",
              width: 120,
              height: 120,
              bgcolor: "action.hover",
            }}
          >
            {/* `<img>` e não `next/image`: a URL é assinada e expira, então o
                otimizador do Next (que cacheia por URL) serviria imagem
                vencida — e exigiria declarar o host do Cloudinary. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.thumbnailUrl}
              alt={photo.caption ?? `Foto de ${label.toLowerCase()}`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>
        ))}
      </Box>
    )}
  </Box>
);
