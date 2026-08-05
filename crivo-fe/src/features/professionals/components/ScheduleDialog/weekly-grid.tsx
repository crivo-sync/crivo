"use client";

import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useSaveSchedule, useSchedule } from "../../hooks/use-schedule";
import type { ScheduleWindow } from "../../types";

const WEEKDAYS = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

/** 480 ⇄ "08:00" — o backend guarda minutos, o input HTML fala "HH:mm". */
const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const WeeklyGrid = ({ professionalId }: { professionalId: string }) => {
  const { windows, isLoading } = useSchedule(professionalId);
  const save = useSaveSchedule(professionalId);

  /**
   * `null` = ainda não editou, então renderiza o que veio do servidor.
   *
   * Derivar assim (em vez de copiar `windows` para o estado num `useEffect`)
   * evita o efeito de sincronização: a grade chega depois do primeiro render,
   * e o efeito causaria render em cascata sem nunca poder sobrescrever uma
   * edição em andamento.
   */
  const [draft, setDraft] = useState<ScheduleWindow[] | null>(null);
  const current = draft ?? windows;
  const isDirty = draft !== null;

  const update = (next: ScheduleWindow[]) => setDraft(next);

  const addWindow = (weekday: number) =>
    update([...current, { weekday, startMinutes: 480, endMinutes: 720 }]);

  const removeWindow = (index: number) =>
    update(current.filter((_, position) => position !== index));

  const editWindow = (index: number, patch: Partial<ScheduleWindow>) =>
    update(
      current.map((window, position) =>
        position === index ? { ...window, ...patch } : window,
      ),
    );

  const handleSave = async () => {
    try {
      await save.mutateAsync(
        // `id` é do banco; o backend recria tudo, então mandar de volta só
        // atrapalharia a validação.
        current.map(({ weekday, startMinutes, endMinutes }) => ({
          weekday,
          startMinutes,
          endMinutes,
        })),
      );
      // Volta a espelhar o servidor: o invalidate do hook traz a versão salva.
      setDraft(null);
    } catch {
      // Erro já exibido pelo snackbar no onError do hook.
    }
  };

  if (isLoading) {
    return (
      <Stack spacing={1}>
        {WEEKDAYS.map((day) => (
          <Skeleton key={day.value} variant="rounded" height={56} />
        ))}
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {current.length === 0 && (
        <Alert severity="info" variant="outlined">
          Sem horário definido: este profissional pode ser agendado em todo o
          expediente da clínica.
        </Alert>
      )}

      <Stack spacing={1}>
        {WEEKDAYS.map((day) => {
          const dayWindows = current
            .map((window, index) => ({ window, index }))
            .filter(({ window }) => window.weekday === day.value);

          return (
            <Box
              key={day.value}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                py: 1,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Typography
                variant="body2"
                sx={{ width: 80, pt: 1, fontWeight: 500 }}
              >
                {day.label}
              </Typography>

              <Stack spacing={1} sx={{ flex: 1 }}>
                {dayWindows.length === 0 && (
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", pt: 1 }}
                  >
                    Não atende
                  </Typography>
                )}

                {dayWindows.map(({ window, index }) => (
                  <Stack
                    key={index}
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center" }}
                  >
                    <TextField
                      type="time"
                      label="Das"
                      value={toTime(window.startMinutes)}
                      onChange={(event) =>
                        editWindow(index, {
                          startMinutes: toMinutes(event.target.value),
                        })
                      }
                      sx={{ width: 130 }}
                    />
                    <TextField
                      type="time"
                      label="Até"
                      value={toTime(window.endMinutes)}
                      onChange={(event) =>
                        editWindow(index, {
                          endMinutes: toMinutes(event.target.value),
                        })
                      }
                      sx={{ width: 130 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeWindow(index)}
                      aria-label={`Remover faixa de ${day.label}`}
                    >
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>

              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => addWindow(day.value)}
                sx={{ mt: 0.5 }}
              >
                Faixa
              </Button>
            </Box>
          );
        })}
      </Stack>

      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", gap: 2 }}
      >
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Mais de uma faixa no mesmo dia cobre intervalo de almoço.
        </Typography>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={save.isPending || !isDirty}
          startIcon={
            save.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : null
          }
        >
          Salvar horários
        </Button>
      </Stack>
    </Stack>
  );
};
