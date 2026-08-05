"use client";

import { useState } from "react";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";

import {
  useAddTimeOff,
  useRemoveTimeOff,
  useTimeOff,
} from "../../hooks/use-schedule";

export const TimeOffList = ({ professionalId }: { professionalId: string }) => {
  const { timeOff, isLoading } = useTimeOff(professionalId);
  const addTimeOff = useAddTimeOff(professionalId);
  const removeTimeOff = useRemoveTimeOff(professionalId);

  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");

  const canSubmit = startsAt && endsAt && !addTimeOff.isPending;

  const handleAdd = async () => {
    try {
      await addTimeOff.mutateAsync({
        // `datetime-local` devolve hora local sem fuso; o `Date` interpreta
        // como local e o ISO leva o offset correto para o servidor.
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        reason: reason || undefined,
      });
      setStartsAt("");
      setEndsAt("");
      setReason("");
    } catch {
      // Erro já exibido pelo snackbar — inclusive o de conflito com
      // agendamento existente, que é o mais comum aqui.
    }
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
          <TextField
            type="datetime-local"
            label="Início"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: 1, minWidth: 190 }}
          />
          <TextField
            type="datetime-local"
            label="Fim"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: 1, minWidth: 190 }}
          />
        </Stack>
        <TextField
          label="Motivo (opcional)"
          placeholder="Férias, congresso…"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          fullWidth
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!canSubmit}
            startIcon={
              addTimeOff.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            Bloquear período
          </Button>
        </Box>
      </Stack>

      {isLoading ? (
        <Stack spacing={1}>
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={60} />
          ))}
        </Stack>
      ) : timeOff.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Nenhum bloqueio cadastrado.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {timeOff.map((block) => (
            <Box
              key={block.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 1.5,
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
                borderLeft: 4,
                borderLeftColor: "warning.main",
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {dayjs(block.startsAt).format("DD/MM/YYYY HH:mm")} →{" "}
                  {dayjs(block.endsAt).format("DD/MM/YYYY HH:mm")}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {block.reason ?? "Sem motivo informado"}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => removeTimeOff.mutate(block.id)}
                disabled={removeTimeOff.isPending}
                aria-label="Remover bloqueio"
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
};
