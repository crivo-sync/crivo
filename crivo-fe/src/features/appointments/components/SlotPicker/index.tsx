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
};

/**
 * Escolha de horário por disponibilidade real, em vez de um relógio livre.
 *
 * Antes, a recepção escolhia qualquer hora e só descobria no submit que o
 * profissional estava ocupado ou que o atendimento passava do fechamento.
 * Aqui o backend devolve apenas os horários em que o procedimento **cabe
 * inteiro** — expediente, duração e agenda do profissional já descontados.
 */
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
      // Diz exatamente o que ainda falta, em vez de repetir a lista inteira:
      // com "escolha profissional, procedimento e dia" o usuário que já
      // preencheu dois dos três não descobre qual está faltando.
      const missing = [
        !professionalId && "o profissional",
        !procedureId && "o procedimento",
        !dateParam && "o dia",
      ].filter(Boolean) as string[];

      const list =
        missing.length > 1
          ? `${missing.slice(0, -1).join(", ")} e ${missing.at(-1)}`
          : missing[0];

      return (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Escolha {list} para ver os horários livres.
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
          Nenhum horário livre neste dia para um procedimento de{" "}
          {formatDuration(availability.durationMinutes)}. Tente outro dia.
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
         * Os horários aparecem de 15 em 15 min porque esse é o passo em que um
         * atendimento pode começar — não o tamanho dele. Sem dizer isso, a
         * recepção lê "10:00, 10:15, 10:30" como consultas de 15 min e acha
         * que o procedimento não cabe.
         */}
        <Typography
          variant="subtitle2"
          sx={{ display: "block", fontWeight: 600 }}
        >
          Horário de início · {availability.slots.length} disponíveis
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", display: "block", mb: 1.5 }}
        >
          O atendimento ocupa {duration}. Os horários abaixo são só as opções de
          começo — a agenda fica reservada até o fim.
        </Typography>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {availability.slots.map((slot) => {
            const isSelected = value === slot.startsAt;
            return (
              <Chip
                key={slot.startsAt}
                label={
                  isSelected
                    ? `${dayjs(slot.startsAt).format("HH:mm")} → ${dayjs(slot.endsAt).format("HH:mm")}`
                    : dayjs(slot.startsAt).format("HH:mm")
                }
                color={isSelected ? "primary" : "default"}
                variant={isSelected ? "filled" : "outlined"}
                onClick={() => onChange(slot.startsAt)}
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
        slotProps={{
          textField: { fullWidth: true, error: !!errorMessage },
        }}
      />

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
