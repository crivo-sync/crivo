"use client";

import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormHelperText from "@mui/material/FormHelperText";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { formatDuration } from "@/lib/duration";
import { useAvailability } from "../../hooks/use-availability";
import type { Availability } from "../../types";

type SlotPickerProps = {
  professionalId?: string;
  procedureId?: string;
  /** ISO do horário escolhido, ou "" enquanto nada foi selecionado. */
  value: string;
  onChange: (isoOrEmpty: string) => void;
  /** Ao reagendar, o horário atual não deve contar como ocupado. */
  excludeAppointmentId?: string;
  errorMessage?: string;
  /** Dias de atendimento (`getDay()`), para desabilitar no calendário. */
  businessDays?: number[];
  /** Fechamento da clínica em minutos desde a meia-noite (1080 = 18:00). */
  businessHoursEnd?: number;
  /** Duração do procedimento escolhido — define se ainda cabe hoje. */
  procedureDurationMinutes?: number;
  /**
   * Grade semanal do profissional escolhido. Vazia/ausente = atende o
   * expediente inteiro da clínica (mesma regra do backend).
   */
  professionalSchedules?: ScheduleWindow[];
};

type ScheduleWindow = {
  weekday: number;
  startMinutes: number;
  endMinutes: number;
};

const WEEKDAY_NAMES = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];

/**
 * "segundas" / "segundas e quartas" / "segundas, quartas e sextas" — a lista
 * de dias em que o profissional atende, para o aviso poder dizer *quando*
 * ele atende em vez de só negar o dia escolhido.
 */
function describeWorkingDays(schedules: ScheduleWindow[]): string | null {
  const weekdays = [...new Set(schedules.map((window) => window.weekday))].sort(
    // Segunda primeiro, domingo por último — a semana como a clínica lê.
    (a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b),
  );

  if (weekdays.length === 0) return null;

  const names = weekdays.map((weekday) => `${WEEKDAY_NAMES[weekday]}s`);

  if (names.length === 1) return names[0];

  return `${names.slice(0, -1).join(", ")} e ${names.at(-1)}`;
}

/**
 * Escolha de horário por disponibilidade real, em vez de um relógio livre.
 *
 * Antes, a recepção escolhia qualquer hora e só descobria no submit que o
 * profissional estava ocupado ou que o atendimento passava do fechamento.
 * Aqui o backend devolve apenas os horários em que o procedimento **cabe
 * inteiro** — expediente, duração e agenda do profissional já descontados.
 */

/** `minutos` da meia-noite → "HH:mm" — mesmo formato que a recepção já lê. */
function minutesToLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Mensagem quando o dia não tem horário livre. O backend devolve o motivo
 * (`noSlotsReason`); sem ele, "nada disponível" é lido como bug — e na
 * prática quase sempre é a grade do profissional (ex.: só atende de manhã)
 * ou o dia já ter passado.
 */
function emptySlotsMessage(
  availability: Availability,
  workingDays: string | null,
): string {
  const duration = formatDuration(availability.durationMinutes);

  switch (availability.noSlotsReason) {
    case "TIME_OFF":
      return availability.timeOff?.reason
        ? `O profissional está indisponível neste período (${availability.timeOff.reason}).`
        : "O profissional está indisponível neste período.";
    case "NOT_WORKING_DAY":
      // Dizer só "não atende" faz parecer defeito quando a grade existe e
      // está certa — o que falta é qual dia escolher.
      return workingDays
        ? `Este profissional atende apenas ${workingDays}. Escolha um desses dias.`
        : "Este profissional não atende neste dia da semana.";
    case "WINDOW_PASSED": {
      const lastEnd = availability.scheduleWindows.at(-1)?.endMinutes;
      return lastEnd != null
        ? `Não há mais horários hoje para ${duration}: o atendimento termina às ${minutesToLabel(lastEnd)}.`
        : `Não há mais horários hoje para ${duration}.`;
    }
    case "ALL_BUSY":
      return `A agenda está cheia neste dia para ${duration}. Tente outro dia.`;
    default:
      return `Nenhum horário livre neste dia para ${duration}. Tente outro dia.`;
  }
}
export const SlotPicker = ({
  professionalId,
  procedureId,
  value,
  onChange,
  excludeAppointmentId,
  errorMessage,
  businessDays,
  businessHoursEnd,
  procedureDurationMinutes,
  professionalSchedules,
}: SlotPickerProps) => {
  // O dia é estado local: o form guarda só o ISO final do horário escolhido,
  // mas o usuário precisa navegar entre dias antes de escolher.
  const [day, setDay] = useState<Dayjs | null>(() =>
    value && dayjs(value).isValid() ? dayjs(value).startOf("day") : null,
  );

  const handleDayChange = (next: Dayjs | null) => {
    setDay(next);
    // Trocar de dia invalida o horário: ele pertencia ao dia anterior.
    if (value) onChange("");
  };

  const dateParam = day?.isValid() ? day.format("YYYY-MM-DD") : undefined;

  /**
   * `null` quando a grade está vazia — que não é "não atende nunca", e sim
   * "herda o expediente da clínica". Tratar vazio como conjunto vazio
   * desabilitaria o calendário inteiro para todo profissional sem grade.
   */
  const workingWeekdays =
    professionalSchedules && professionalSchedules.length > 0
      ? new Set(professionalSchedules.map((window) => window.weekday))
      : null;

  const workingDays = professionalSchedules
    ? describeWorkingDays(professionalSchedules)
    : null;

  /**
   * Hoje deixa de servir quando o atendimento não cabe mais antes do
   * fechamento — o último início possível é `fechamento - duração`. Antes o
   * calendário deixava escolher hoje às 18h e só depois a lista de horários
   * vinha vazia, sem dizer o porquê.
   */
  const isTodayOver = (() => {
    if (businessHoursEnd == null || !procedureDurationMinutes) return false;
    const now = dayjs();
    const nowInMinutes = now.hour() * 60 + now.minute();
    return nowInMinutes > businessHoursEnd - procedureDurationMinutes;
  })();

  const isDayUnavailable = (date: Dayjs) => {
    if (businessDays && !businessDays.includes(date.day())) return true;
    // Grade do profissional: sem isso o calendário oferece o dia inteiro e a
    // recusa só aparece depois de escolher, que é o que fazia a tela parecer
    // quebrada. Grade vazia segue liberando tudo (herda o expediente).
    if (workingWeekdays && !workingWeekdays.has(date.day())) return true;
    if (isTodayOver && date.isSame(dayjs(), "day")) return true;
    return false;
  };

  const { availability, isFetching, error, enabled } = useAvailability({
    professionalId,
    procedureId,
    date: dateParam,
    excludeAppointmentId,
  });

  const renderSlots = () => {
    if (!enabled) {
      // Profissional e procedimento faltando já são ditos no helper do campo
      // Dia (que fica desabilitado até os dois existirem) — repetir aqui
      // colocaria duas mensagens sobre o mesmo assunto na tela.
      if (!professionalId || !procedureId) return null;

      return (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Escolha o dia para ver os horários livres.
        </Typography>
      );
    }

    if (isFetching) {
      return (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" width={72} height={32} />
          ))}
        </Box>
      );
    }

    if (error) return <Alert severity="error">{error.message}</Alert>;
    if (!availability) return null;

    if (availability.closed) {
      return <Alert severity="info">A clínica não atende neste dia.</Alert>;
    }

    if (availability.slots.length === 0) {
      return (
        <Alert severity="warning">
          {emptySlotsMessage(availability, workingDays)}
        </Alert>
      );
    }

    const duration = formatDuration(availability.durationMinutes);
    const selectedSlot = availability.slots.find(
      (slot) => slot.startsAt === value,
    );

    return (
      <>
        {/*
         * Os horários são oferecidos de 15 em 15 min porque esse é o passo em
         * que um atendimento pode COMEÇAR — não o tamanho dele. Uma legenda
         * explicando isso não resolvia: a recepção lê os chips primeiro e
         * conclui "consultas de 15 min". Por isso a duração aparece no título
         * e cada chip mostra início → fim.
         */}
        <Typography
          variant="subtitle2"
          sx={{ display: "block", fontWeight: 600 }}
        >
          Escolha o horário · {availability.slots.length}{" "}
          {availability.slots.length === 1 ? "opção" : "opções"} de {duration}
        </Typography>

        {/* Grid em vez de flex-wrap: com larguras iguais os horários ficam
            em colunas alinhadas, em vez de uma última linha irregular que
            faz a lista parecer desorganizada. */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 1,
            mt: 1.5,
          }}
        >
          {availability.slots.map((slot) => {
            const isSelected = value === slot.startsAt;
            return (
              <Chip
                key={slot.startsAt}
                // Sempre "08:00 → 08:30", nunca só "08:00". A legenda em letra
                // miúda não era lida antes dos chips, e uma lista de horários
                // de 15 em 15 min passa a impressão de consultas de 15 min —
                // mostrar o fim em cada opção elimina a leitura errada.
                label={`${dayjs(slot.startsAt).format("HH:mm")} → ${dayjs(slot.endsAt).format("HH:mm")}`}
                color={isSelected ? "primary" : "default"}
                variant={isSelected ? "filled" : "outlined"}
                onClick={() => onChange(slot.startsAt)}
                sx={{ width: "100%" }}
              />
            );
          })}
        </Box>

        {selectedSlot && (
          <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 500 }}>
            Reservado das {dayjs(selectedSlot.startsAt).format("HH:mm")} às{" "}
            {dayjs(selectedSlot.endsAt).format("HH:mm")} ({duration}).
          </Typography>
        )}
      </>
    );
  };

  return (
    <Box>
      <DatePicker
        label="Dia"
        value={day}
        onChange={handleDayChange}
        disablePast
        shouldDisableDate={isDayUnavailable}
        // Sem profissional e procedimento não dá para saber quais dias
        // desabilitar (a grade é de quem atende, e a duração define se cabe):
        // um calendário aberto aqui ofereceria dias que seriam recusados
        // depois. Segue a cascata dos campos acima.
        disabled={!professionalId || !procedureId}
        slotProps={{
          textField: {
            fullWidth: true,
            error: !!errorMessage,
            helperText:
              !professionalId || !procedureId
                ? "Escolha o profissional e o procedimento antes."
                : undefined,
          },
        }}
      />

      {/* Dito antes de escolher, não depois de recusar: os dias fora da
          grade aparecem desabilitados no calendário, e sem esta linha o
          motivo de estarem cinzas fica adivinhação. */}
      {workingDays && (
        <FormHelperText sx={{ mx: 1.75 }}>
          Este profissional atende {workingDays}.
        </FormHelperText>
      )}

      {isTodayOver && (
        <FormHelperText sx={{ mx: 1.75 }}>
          A clínica já fechou hoje — escolha a partir de amanhã.
        </FormHelperText>
      )}

      <Box sx={{ mt: 2 }}>{renderSlots()}</Box>

      {errorMessage && <FormHelperText error>{errorMessage}</FormHelperText>}
    </Box>
  );
};
