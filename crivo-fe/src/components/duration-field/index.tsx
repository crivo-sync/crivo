"use client";

import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

import {
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  formatDuration,
} from "@/lib/duration";

const HOUR_OPTIONS = Array.from(
  { length: Math.floor(MAX_DURATION_MINUTES / 60) + 1 },
  (_, index) => index,
);

const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => index * 5);

type DurationFieldProps = {
  /** Duração total em minutos — o formato que o backend armazena. */
  value: number;
  onChange: (minutes: number) => void;
  onBlur?: () => void;
  label?: string;
  errorMessage?: string;
};

/**
 * Duração em horas + minutos. O backend continua recebendo minutos, mas
 * ninguém numa clínica pensa "120 minutos" — pensa "2 horas", e converter de
 * cabeça na hora de cadastrar é onde o erro acontece.
 */
export const DurationField = ({
  value,
  onChange,
  onBlur,
  label = "Duração",
  errorMessage,
}: DurationFieldProps) => {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  // Uma duração legada fora da grade de 5 min (ex.: 7) ainda precisa aparecer
  // selecionada, senão o campo abre vazio e o usuário perde o valor salvo.
  const minuteOptions = MINUTE_OPTIONS.includes(minutes)
    ? MINUTE_OPTIONS
    : [...MINUTE_OPTIONS, minutes].sort((a, b) => a - b);

  const commit = (total: number) =>
    onChange(
      Math.min(Math.max(total, MIN_DURATION_MINUTES), MAX_DURATION_MINUTES),
    );

  return (
    <FormControl error={!!errorMessage} fullWidth>
      <FormLabel sx={{ mb: 1, fontSize: 14 }}>{label}</FormLabel>

      <Stack direction="row" spacing={2}>
        <TextField
          select
          id="durationHours"
          label="Horas"
          value={hours}
          onChange={(event) => commit(Number(event.target.value) * 60 + minutes)}
          onBlur={onBlur}
          error={!!errorMessage}
          sx={{ flex: 1 }}
        >
          {HOUR_OPTIONS.map((hour) => (
            <MenuItem
              key={hour}
              value={hour}
              disabled={hour * 60 + minutes > MAX_DURATION_MINUTES}
            >
              {hour} h
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          id="durationMinutes"
          label="Minutos"
          value={minutes}
          onChange={(event) => commit(hours * 60 + Number(event.target.value))}
          onBlur={onBlur}
          error={!!errorMessage}
          sx={{ flex: 1 }}
        >
          {minuteOptions.map((minute) => (
            <MenuItem
              key={minute}
              value={minute}
              disabled={
                hours * 60 + minute > MAX_DURATION_MINUTES ||
                hours * 60 + minute < MIN_DURATION_MINUTES
              }
            >
              {minute} min
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <FormHelperText>
        {errorMessage ?? `${formatDuration(value)} · ${value} min no total`}
      </FormHelperText>
    </FormControl>
  );
};
