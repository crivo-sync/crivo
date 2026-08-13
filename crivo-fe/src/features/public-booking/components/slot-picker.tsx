"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";

import type { Availability } from "../types";

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

/** Traduz o motivo que o backend devolve — sem isso o enum cru
 * (`WINDOW_PASSED`) aparecia na tela de um paciente que não programa. */
function noSlotsMessage(reason: string | null | undefined): string {
  switch (reason) {
    case "TIME_OFF":
      return "O profissional está indisponível neste período.";
    case "NOT_WORKING_DAY":
      return "O profissional não atende neste dia. Escolha outra data.";
    case "WINDOW_PASSED":
      return "Não há mais horários hoje. Escolha outra data.";
    case "ALL_BUSY":
      return "A agenda está cheia neste dia. Tente outra data.";
    default:
      return "Nenhum horário livre nesse dia. Escolha outra data.";
  }
}

const gridSx = {
  display: "grid",
  gap: 1,
  gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" },
} as const;

type SlotPickerProps = {
  availability: Availability | null;
  isLoading: boolean;
  selectedStartsAt: string | null;
  onSelect: (startsAt: string) => void;
};

export const SlotPicker = ({
  availability,
  isLoading,
  selectedStartsAt,
  onSelect,
}: SlotPickerProps) => {
  if (isLoading) {
    return (
      <Box sx={gridSx} aria-busy>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rounded" height={44} />
        ))}
      </Box>
    );
  }

  if (!availability) return null;

  if (availability.closed) {
    return (
      <Alert severity="warning">
        A clínica não atende nesse dia. Escolha outra data.
      </Alert>
    );
  }

  if (availability.slots.length === 0) {
    return <Alert severity="warning">{noSlotsMessage(availability.noSlotsReason)}</Alert>;
  }

  return (
    <Box sx={gridSx} role="group" aria-label="Horários disponíveis">
      {availability.slots.map((slot) => {
        const isSelected = slot.startsAt === selectedStartsAt;

        return (
          <Button
            key={slot.startsAt}
            type="button"
            variant={isSelected ? "contained" : "outlined"}
            onClick={() => onSelect(slot.startsAt)}
            aria-pressed={isSelected}
            sx={{ height: 44, textTransform: "none" }}
          >
            {/* Início → fim, não só o começo: uma lista de "10:00, 10:15"
                passa a impressão de consultas de 15 min. */}
            {timeLabel(slot.startsAt)} → {timeLabel(slot.endsAt)}
          </Button>
        );
      })}
    </Box>
  );
};
