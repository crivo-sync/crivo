"use client";

import "dayjs/locale/pt-br";
import { ptBR as dateFnsPtBR } from "date-fns/locale";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { EventCalendar } from "@mui/x-scheduler/event-calendar";
import { ptBR as schedulerPtBR } from "@mui/x-scheduler/locales";

import { ErrorServer } from "@/components/ui/error-server";
import { ScheduleLegend } from "./ScheduleLegend";
import { CLINIC_TIMEZONE } from "./off-hours";
import { useScheduleBoardData } from "./use-schedule-board-data";

/** "08:00" a partir da hora cheia. */
const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

/**
 * Repõe os rótulos das pontas do eixo de horas — a abertura e o fechamento
 * da clínica.
 *
 * O `DayTimeGrid` do scheduler desenha uma célula por hora rotulada no topo
 * e **omite o primeiro rótulo de propósito** (`index === 0 ? null : …`), o
 * que engole a abertura; e como a última célula é a de 17:00–18:00, não
 * existe célula alguma para rotular o fechamento. O resultado é uma grade de
 * 08:00 às 18:00 cujo eixo começa em 09:00 e termina em 17:00 — as duas
 * horas que a recepção mais precisa ler.
 *
 * A grade em si está correta; isto é só rotulagem, então resolver por CSS
 * (`::before`/`::after` na primeira célula) evita reimplementar o eixo. As
 * classes `MuiEventCalendar-*` são API pública do pacote.
 */
const timeAxisEdgeLabels = ({
  start,
  end,
}: {
  start: number;
  end: number;
}) => ({
  "& .MuiEventCalendar-dayTimeGridTimeAxisCell:first-of-type": {
    position: "relative",
    "&::before, &::after": {
      position: "absolute",
      // Mesmo recuo do `paddingInline: theme.spacing(1)` das demais células,
      // para os rótulos das pontas alinharem com os do meio.
      right: 8,
      fontSize: "var(--EventCalendar-fontSize-timeText, 0.75rem)",
      // A célula herda `lineHeight: calc(100% / --hours-count)`, que vale a
      // altura da grade inteira: sem sobrescrever, o rótulo é empurrado para
      // fora da área visível (foi por isso que só o de fechamento aparecia —
      // aquele tem `top` próprio).
      lineHeight: 1,
      color: "text.secondary",
      whiteSpace: "nowrap",
    },
    // Abertura: encostada no topo, SEM centralizar na divisória. O container
    // do eixo tem `overflow-y: auto` e não há espaço acima da primeira linha,
    // então um `translateY(-50%)` aqui cortaria metade do texto.
    "&::before": { content: `"${hourLabel(start)}"`, top: 0 },
    // Fechamento: uma grade inteira abaixo do topo, que é a base da última
    // linha — `--hour-height` é a variável que o próprio scheduler usa.
    "&::after": {
      content: `"${hourLabel(end)}"`,
      top: `calc(${end - start} * var(--hour-height))`,
      transform: "translateY(-50%)",
    },
  },
});

/**
 * Quadro com a agenda de todos os profissionais numa única grade, colorida
 * por profissional e filtrável pelo painel de recursos. Existe para
 * responder "quem tem vaga agora?" olhando, em vez de abrir o formulário de
 * agendamento e ir trocando profissional/dia até achar um horário livre.
 *
 * Somente leitura de propósito: marcar continua pelo formulário validado
 * (`AppointmentFormDialog`), que já aplica expediente, grade do profissional
 * e duração do procedimento. Um clique-para-criar aqui duplicaria essas
 * regras num segundo lugar — e divergiria delas mais cedo ou mais tarde.
 */
export const ScheduleBoard = () => {
  const board = useScheduleBoardData();

  if (board.error) {
    return (
      <ErrorServer message={board.error.message} onRetry={board.refetch} />
    );
  }

  if (board.isLoading) {
    return <Skeleton variant="rounded" height={600} />;
  }

  return (
    <Stack spacing={1.5}>
      {board.isTruncated && (
        <Alert severity="warning">
          Muitos agendamentos nesta janela — a lista pode estar incompleta. Veja
          o período completo em Agenda → Lista.
        </Alert>
      )}

      {/* Grade semanal de cada profissional — espaço vazio fora da grade não
          é horário livre, e a legenda deixa isso explícito. */}
      <ScheduleLegend professionals={board.professionals} />

      <Alert severity="info" variant="outlined">
        {board.soloProfessional
          ? `As faixas cinza são horários em que ${board.soloProfessional.name} não atende.`
          : "Deixe apenas um profissional marcado em Recursos para ver, em cinza, os horários em que ele não atende."}
      </Alert>

      <Box
        sx={{
          height: 700,
          width: "100%",
          ...timeAxisEdgeLabels(board.gridHours),
        }}
      >
        <EventCalendar
          resources={board.resources}
          events={board.events}
          readOnly
          views={["day", "week"]}
          view={board.view}
          onViewChange={(view) => {
            // Só "day" e "week" estão habilitadas via `views` acima.
            if (view === "day" || view === "week") board.setView(view);
          }}
          visibleDate={board.visibleDate}
          onVisibleDateChange={(date) => board.setVisibleDate(date)}
          visibleResources={board.visibleResources}
          onVisibleResourcesChange={(next) => board.setVisibleResources(next)}
          displayTimezone={CLINIC_TIMEZONE}
          dateLocale={dateFnsPtBR}
          localeText={
            schedulerPtBR.components.MuiEventCalendar.defaultProps.localeText
          }
          // `ampm: false` → 14:00 em vez de 2:00 PM. O default do scheduler é
          // `true` (formato americano), e no Brasil ninguém lê a agenda da
          // clínica em AM/PM.
          defaultPreferences={{
            weekStartsOn: 1,
            showWeekends: true,
            ampm: false,
          }}
          viewConfig={{
            day: {
              startTime: board.gridHours.start,
              endTime: board.gridHours.end,
            },
            week: {
              startTime: board.gridHours.start,
              endTime: board.gridHours.end,
            },
          }}
        />
      </Box>
    </Stack>
  );
};
