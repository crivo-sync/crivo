import dayjs, { type Dayjs } from "dayjs";

/**
 * Só os dois valores que esta tela usa (`views={['day', 'week']}` no
 * `EventCalendar`). O tipo completo (`CalendarView`, que inclui `month` e
 * `agenda`) só é exportado pelo pacote `-internals`, não pela entrada
 * pública — declarar aqui evita depender de um caminho de import instável
 * em um pacote ainda beta.
 */
export type BoardView = "day" | "week";

/**
 * Início da semana em segunda-feira, calculado à mão em vez de
 * `dayjs().startOf('week')`: esse método depende do locale configurado
 * globalmente (que varia por componente neste projeto — ver
 * `mui-provider.tsx` vs. `confirmation-card.tsx`), e um domingo-início
 * silencioso deixaria a janela buscada da API dessincronizada da semana
 * exibida no calendário.
 */
function startOfWeekMonday(date: Dayjs): Dayjs {
  const weekday = date.day(); // 0=domingo … 6=sábado
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  return date.add(diffToMonday, "day").startOf("day");
}

export type VisibleRange = { from: Date; to: Date };

/**
 * Janela de busca para a API a partir do que o calendário está mostrando.
 * Sempre a semana inteira (segunda a domingo) mesmo na visão "dia", para não
 * refazer a consulta a cada troca de dia dentro da mesma semana.
 */
export function getVisibleRange(visibleDate: Date, view: BoardView): VisibleRange {
  const date = dayjs(visibleDate);

  if (view === "day") {
    return { from: date.startOf("day").toDate(), to: date.endOf("day").toDate() };
  }

  const start = startOfWeekMonday(date);
  return { from: start.toDate(), to: start.add(6, "day").endOf("day").toDate() };
}
