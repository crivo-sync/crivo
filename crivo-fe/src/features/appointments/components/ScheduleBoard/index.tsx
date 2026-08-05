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
import { useScheduleBoardData } from "./use-schedule-board-data";

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

      <Box sx={{ height: 700, width: "100%" }}>
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
          displayTimezone="America/Sao_Paulo"
          dateLocale={dateFnsPtBR}
          localeText={
            schedulerPtBR.components.MuiEventCalendar.defaultProps.localeText
          }
          defaultPreferences={{ weekStartsOn: 1, showWeekends: true }}
          viewConfig={{
            day: { startTime: 7, endTime: 20 },
            week: { startTime: 7, endTime: 20 },
          }}
        />
      </Box>
    </Stack>
  );
};
