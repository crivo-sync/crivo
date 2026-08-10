"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useTenant } from "@/features/tenant/hooks/use-tenant";
import { useSaveSchedule, useSchedule } from "../../hooks/use-schedule";
import type { ScheduleWindow } from "../../types";
import {
  hasInvalidWindow,
  WEEKDAYS,
  WeeklyGridEditor,
} from "./weekly-grid-editor";

export const WeeklyGrid = ({ professionalId }: { professionalId: string }) => {
  const { windows, isLoading } = useSchedule(professionalId);
  const save = useSaveSchedule(professionalId);
  const { tenant } = useTenant();

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
      <WeeklyGridEditor
        value={current}
        onChange={setDraft}
        clinicHours={tenant}
      />

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
          disabled={save.isPending || !isDirty || hasInvalidWindow(current)}
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
