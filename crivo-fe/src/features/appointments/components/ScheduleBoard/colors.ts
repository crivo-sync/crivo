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
