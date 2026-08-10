"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import type { Professional } from "@/features/professionals/types";
import { colorHexForIndex } from "./colors";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** `minutos` da meia-noite → "HH:mm". */
function minutesToLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * "Seg 08:00–12:00 · Ter 08:00–12:00 e 13:00–18:00". Sem grade cadastrada o
 * profissional atende no expediente inteiro da clínica — dizer isso é o que
 * evita a recepção achar que espaço vazio no Quadro é horário livre.
 */
function formatSchedule(professional: Professional): string {
  // Ausente ou vazio = sem grade cadastrada = atende o expediente da clínica.
  const schedules = professional.schedules ?? [];

  if (schedules.length === 0) {
    return "atende no expediente da clínica";
  }

  const byDay = new Map<
    number,
    { startMinutes: number; endMinutes: number }[]
  >();
  for (const window of schedules) {
    const list = byDay.get(window.weekday) ?? [];
    list.push(window);
    byDay.set(window.weekday, list);
  }

  const parts: string[] = [];
  for (const [weekday, windows] of byDay) {
    const range = windows
      .map(
        (window) =>
          `${minutesToLabel(window.startMinutes)}–${minutesToLabel(window.endMinutes)}`,
      )
      .join(" e ");
    parts.push(`${WEEKDAY_LABELS[weekday]} ${range}`);
  }
  return parts.join(" · ");
}

/**
 * Legenda do Quadro: mostra a grade semanal de cada profissional com a cor
 * dele no calendário. Existe para responder "quando este profissional
 * atende?" sem precisar abrir a tela de agenda — e para deixar claro que
 * espaço vazio fora da grade não é horário livre.
 */
export const ScheduleLegend = ({
  professionals,
}: {
  professionals: Professional[];
}) => {
  if (professionals.length === 0) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        px: 0.5,
      }}
    >
      {professionals.map((professional, index) => (
        <Box
          key={professional.id}
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <Box
            aria-hidden
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: colorHexForIndex(index),
              flexShrink: 0,
            }}
          />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            <Box
              component="span"
              sx={{ fontWeight: 600, color: "text.primary" }}
            >
              {professional.name}
            </Box>
            {" — "}
            {formatSchedule(professional)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};
