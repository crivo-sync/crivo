import type { SchedulerEventColor } from "@mui/x-scheduler/models";

/**
 * Cinza fica fora do ciclo: é a cor neutra que o próprio pacote usa como
 * padrão, e aqui cada profissional precisa de uma cor que o distinga dos
 * demais no quadro.
 */
const PALETTE: SchedulerEventColor[] = [
  "blue",
  "green",
  "purple",
  "orange",
  "teal",
  "pink",
  "indigo",
  "amber",
  "lime",
  "red",
];

/**
 * Cor estável por posição na lista de profissionais (ordenada por nome pelo
 * backend). Estável entre recarregamentos enquanto a equipe não muda; se
 * alguém for cadastrado ou removido, as cores dos demais podem deslocar —
 * é o preço de um ciclo simples, aceitável para uma lista de poucas pessoas.
 */
export function colorForIndex(index: number): SchedulerEventColor {
  return PALETTE[index % PALETTE.length];
}

/** Nome da paleta do scheduler → cor concreta (para a legenda do Quadro). */
const PALETTE_HEX: Record<SchedulerEventColor, string> = {
  grey: "#757575",
  blue: "#1976d2",
  green: "#2e7d32",
  purple: "#7b1fa2",
  orange: "#ed6c02",
  teal: "#00796b",
  pink: "#c2185b",
  indigo: "#3f51b5",
  amber: "#ff8f00",
  lime: "#9e9d24",
  red: "#d32f2f",
};

export function colorHexForIndex(index: number): string {
  return PALETTE_HEX[colorForIndex(index)];
}
