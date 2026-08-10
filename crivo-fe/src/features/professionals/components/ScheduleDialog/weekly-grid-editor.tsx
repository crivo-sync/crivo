"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { type Dayjs } from "dayjs";

import type { ScheduleWindow } from "../../types";

export const WEEKDAYS = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

/** 480 ⇄ dayjs — o backend guarda minutos desde a meia-noite. */
const minutesToDayjs = (minutes: number): Dayjs =>
  dayjs().startOf("day").add(minutes, "minute");

const dayjsToMinutes = (value: Dayjs) => value.hour() * 60 + value.minute();

type WeeklyGridEditorProps = {
  value: ScheduleWindow[];
  onChange: (next: ScheduleWindow[]) => void;
  /** Expediente da clínica, em minutos desde a meia-noite. */
  clinicHours?: { businessHoursStart: number; businessHoursEnd: number };
};

/** 08:00–18:00 — só vale enquanto o expediente da clínica não carregou. */
const DEFAULT_DAY_START = 480;
const DEFAULT_DAY_END = 1080;

/**
 * Passo dos minutos. É o mesmo com que a agenda oferece horários de início,
 * então a grade não pode terminar em 08:07 e criar uma borda que nenhum
 * agendamento consegue usar.
 */
const STEP_MINUTES = 15;

/**
 * Problemas que impedem salvar, por faixa. O backend recusa os dois, mas
 * esperar o 400 esconde *qual* das linhas está errada — aqui o erro aparece
 * no campo que o causou.
 */
function findWindowIssue(
  window: ScheduleWindow,
  index: number,
  all: ScheduleWindow[],
): string | null {
  if (window.endMinutes <= window.startMinutes) {
    return "O fim precisa ser depois do início.";
  }

  const overlaps = all.some(
    (other, position) =>
      position !== index &&
      other.weekday === window.weekday &&
      window.startMinutes < other.endMinutes &&
      other.startMinutes < window.endMinutes,
  );

  return overlaps ? "Esta faixa se sobrepõe a outra do mesmo dia." : null;
}

/**
 * `true` quando alguma faixa impede salvar. Os formulários usam isto para
 * desabilitar o botão — mandar assim só devolveria 400 do backend, e o
 * usuário perderia a edição sem saber qual linha corrigir.
 */
export function hasInvalidWindow(windows: ScheduleWindow[]): boolean {
  return windows.some((window, index) =>
    Boolean(findWindowIssue(window, index, windows)),
  );
}

/**
 * Só a edição da grade — sem busca, sem salvamento, sem botão.
 *
 * Existe separado porque a grade é editada em dois contextos com ciclos de
 * vida opostos: no dialog de Horários o profissional já existe e cada
 * alteração vai direto para a API; no cadastro ele ainda não tem `id`, então
 * a grade só pode viver em memória até a criação acontecer. Manter a UI aqui
 * é o que impede as duas telas de divergirem no formato das faixas.
 */
export const WeeklyGridEditor = ({
  value,
  onChange,
  clinicHours,
}: WeeklyGridEditorProps) => {
  const dayStart = clinicHours?.businessHoursStart ?? DEFAULT_DAY_START;
  const dayEnd = clinicHours?.businessHoursEnd ?? DEFAULT_DAY_END;

  /**
   * A faixa nova começa onde a última daquele dia terminou, não sempre em
   * 08:00 — repetir o mesmo horário criava faixa duplicada, que é inválida
   * (sobreposição) e obrigava a recepção a corrigir os dois campos na mão.
   *
   * A segunda faixa do dia costuma ser a volta do almoço, então uma hora de
   * intervalo é o palpite útil; o resto do expediente é o fim.
   */
  /** Fim da última faixa já cadastrada no dia, ou `null` se não houver. */
  const lastEndOf = (weekday: number): number | null =>
    value
      .filter((window) => window.weekday === weekday)
      .reduce<number | null>(
        (latest, window) =>
          latest == null || window.endMinutes > latest
            ? window.endMinutes
            : latest,
        null,
      );

  /**
   * Só há espaço para outra faixa se sobrar pelo menos meia hora de
   * expediente depois da última. Sem esta checagem, "+ Faixa" num dia já
   * cheio criava uma linha fora do expediente (19:00→19:30 numa clínica que
   * fecha às 18:00), que o backend recusa no salvamento.
   */
  const canAddWindow = (weekday: number): boolean => {
    const lastEnd = lastEndOf(weekday);
    if (lastEnd == null) return true;
    return lastEnd + 60 + 30 <= dayEnd;
  };

  const addWindow = (weekday: number) => {
    const lastEnd = lastEndOf(weekday);

    // A segunda faixa do dia costuma ser a volta do almoço, então uma hora de
    // intervalo é o palpite útil; o resto do expediente é o fim.
    const start = lastEnd == null ? dayStart : lastEnd + 60;

    onChange([
      ...value,
      { weekday, startMinutes: start, endMinutes: dayEnd },
    ]);
  };

  const removeWindow = (index: number) =>
    onChange(value.filter((_, position) => position !== index));

  const editWindow = (index: number, patch: Partial<ScheduleWindow>) =>
    onChange(
      value.map((window, position) =>
        position === index ? { ...window, ...patch } : window,
      ),
    );

  return (
    <Stack spacing={2}>
      {value.length === 0 && (
        <Alert severity="info" variant="outlined">
          Sem horário definido: este profissional pode ser agendado em todo o
          expediente da clínica.
        </Alert>
      )}

      <Stack spacing={1}>
        {WEEKDAYS.map((day) => {
          const dayWindows = value
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

                {dayWindows.map(({ window, index }) => {
                  const issue = findWindowIssue(window, index, value);

                  return (
                  <Stack
                    key={index}
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "flex-start" }}
                  >
                    <TimePicker
                      label="Das"
                      value={minutesToDayjs(window.startMinutes)}
                      onChange={(next) => {
                        // Durante a digitação o valor é um dayjs inválido
                        // (não nulo) — gravá-lo produziria NaN nos minutos.
                        if (!next?.isValid()) return;
                        editWindow(index, {
                          startMinutes: dayjsToMinutes(next),
                        });
                      }}
                      ampm={false}
                      format="HH:mm"
                      // A lista de horas ia de 00 a 23, oferecendo madrugada
                      // para uma clínica que abre às 08:00 — e o backend
                      // recusaria no salvamento. Limitar aqui faz a opção
                      // impossível nem aparecer.
                      minTime={minutesToDayjs(dayStart)}
                      maxTime={minutesToDayjs(dayEnd)}
                      minutesStep={STEP_MINUTES}
                      slotProps={{
                        textField: {
                          error: !!issue,
                          sx: { width: 130 },
                        },
                      }}
                    />
                    <TimePicker
                      label="Até"
                      value={minutesToDayjs(window.endMinutes)}
                      onChange={(next) => {
                        if (!next?.isValid()) return;
                        editWindow(index, { endMinutes: dayjsToMinutes(next) });
                      }}
                      ampm={false}
                      format="HH:mm"
                      // O fim nunca pode ser antes do próprio início.
                      minTime={minutesToDayjs(window.startMinutes)}
                      maxTime={minutesToDayjs(dayEnd)}
                      minutesStep={STEP_MINUTES}
                      slotProps={{
                        textField: {
                          error: !!issue,
                          helperText: issue ?? undefined,
                          sx: {
                            width: 130,
                            // A mensagem é larga e o campo é estreito: sem
                            // isto, o helper empurra a linha e desalinha o dia.
                            "& .MuiFormHelperText-root": {
                              width: 240,
                              ml: 0,
                            },
                          },
                        },
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeWindow(index)}
                      aria-label={`Remover faixa de ${day.label}`}
                      sx={{ mt: 0.5 }}
                    >
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  );
                })}
              </Stack>

              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => addWindow(day.value)}
                disabled={!canAddWindow(day.value)}
                title={
                  canAddWindow(day.value)
                    ? undefined
                    : "As faixas deste dia já cobrem o expediente da clínica."
                }
                sx={{ mt: 0.5 }}
              >
                Faixa
              </Button>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
};
