"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Pagination from "@mui/material/Pagination";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";

import { useAddClinicalNote } from "../../hooks/use-add-clinical-note";
import { useClinicalNotes } from "../../hooks/use-clinical-notes";
import {
  clinicalNoteFormSchema,
  type ClinicalNoteFormSchema,
} from "../../schemas/medical-record";

const PER_PAGE = 10;

export const ClinicalNotes = ({ patientId }: { patientId: string }) => {
  const [page, setPage] = useState(1);
  const { notes, meta, isLoading } = useClinicalNotes(patientId, {
    page,
    perPage: PER_PAGE,
  });
  const addNote = useAddClinicalNote(patientId);

  const { control, handleSubmit, reset, formState } =
    useForm<ClinicalNoteFormSchema>({
      resolver: zodResolver(clinicalNoteFormSchema),
      defaultValues: { content: "" },
    });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await addNote.mutateAsync(values);
      reset({ content: "" });
      // Nota nova entra no topo: volta para a primeira página para o autor
      // ver o que acabou de escrever.
      setPage(1);
    } catch {
      // Erro já exibido pelo snackbar no onError do hook.
    }
  });

  return (
    <Stack spacing={3}>
      <form onSubmit={onSubmit}>
        <Stack spacing={1.5}>
          <Controller
            control={control}
            name="content"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                id="content"
                label="Nova evolução"
                placeholder="O que foi feito, o que o paciente relatou, próximos passos…"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                multiline
                minRows={3}
                fullWidth
              />
            )}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="submit"
              variant="contained"
              disabled={addNote.isPending || !formState.isDirty}
              startIcon={
                addNote.isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
            >
              Registrar evolução
            </Button>
          </Box>
        </Stack>
      </form>

      {/* O registro é append-only: por isso não há botão de editar nem
          excluir em nenhuma nota. Corrigir = escrever uma nota nova. */}
      <Alert severity="info" variant="outlined">
        Evoluções não podem ser editadas nem apagadas. Para corrigir algo,
        registre uma nova evolução.
      </Alert>

      {isLoading ? (
        <Stack spacing={1.5}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={90} />
          ))}
        </Stack>
      ) : notes.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Nenhuma evolução registrada ainda.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {notes.map((note) => (
            <Box
              key={note.id}
              sx={{
                p: 2,
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
                borderLeft: 4,
                borderLeftColor: "primary.main",
              }}
            >
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 2,
                  mb: 1,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {note.author.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {dayjs(note.createdAt).format("DD/MM/YYYY [às] HH:mm")}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                {note.content}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}

      {meta && meta.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Pagination
            size="small"
            count={meta.totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
          />
        </Box>
      )}
    </Stack>
  );
};
