"use client";

import { useMemo, useState } from "react";

import { useProfessionals } from "@/features/professionals/hooks/use-professionals";
import { useTimeOff } from "@/features/professionals/hooks/use-schedule";
import { useTenant } from "@/features/tenant/hooks/use-tenant";
import { useAppointments } from "../../hooks/use-appointments";
import {
  appointmentsToEvents,
  professionalsToResources,
} from "./map-to-scheduler";
import { buildOffHoursEvents } from "./off-hours";
import {
  getVisibleDays,
  getVisibleRange,
  type BoardView,
} from "./visible-range";

/**
 * Teto de 200 é o máximo aceito pela API por página. Uma clínica com mais
 * agendamentos que isso numa única semana é o caso raro que merece aviso na
 * tela, não paginação silenciosa escondendo parte da agenda.
 */
const MAX_APPOINTMENTS_PER_FETCH = 200;

/**
 * Faixa desenhada na grade quando o expediente da clínica ainda não chegou.
 * Só vale durante o carregamento — assim que `useTenant()` resolve, a grade
 * passa a ser a da clínica.
 */
const FALLBACK_GRID_START_HOUR = 8;
const FALLBACK_GRID_END_HOUR = 20;

/**
 * Faixa de horas desenhada na grade, derivada do expediente da clínica.
 *
 * Não é constante porque uma grade fixa desenha linhas fora do expediente e
 * as pinta de "não atende" — a clínica abre às 08:00, mas a grade começava
 * às 07:00 e sobrava uma faixa cinza que não representa decisão nenhuma da
 * clínica. Fora do expediente não é "o profissional não atende", é "a
 * clínica está fechada", e isso já é dito pelo próprio limite da grade.
 *
 * O fechamento arredonda para cima porque `endTime` é exclusivo: com
 * fechamento às 18:00 a grade precisa ir até 18 para desenhar a linha das
 * 17:00–18:00.
 */
export function getGridHours(clinic?: {
  businessHoursStart: number;
  businessHoursEnd: number;
}) {
  if (!clinic) {
    return { start: FALLBACK_GRID_START_HOUR, end: FALLBACK_GRID_END_HOUR };
  }

  return {
    start: Math.floor(clinic.businessHoursStart / 60),
    end: Math.ceil(clinic.businessHoursEnd / 60),
  };
}

export function useScheduleBoardData() {
  const [view, setView] = useState<BoardView>("week");
  const [visibleDate, setVisibleDate] = useState<Date>(() => new Date());
  const [visibleResources, setVisibleResources] = useState<
    Record<string, boolean>
  >({});

  const range = useMemo(
    () => getVisibleRange(visibleDate, view),
    [visibleDate, view],
  );

  const professionals = useProfessionals({ page: 1, perPage: 100 });
  const { tenant } = useTenant();

  const appointments = useAppointments({
    page: 1,
    perPage: MAX_APPOINTMENTS_PER_FETCH,
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  });

  const activeProfessionals = useMemo(
    () =>
      professionals.professionals.filter(
        (professional) => professional.isActive,
      ),
    [professionals.professionals],
  );

  const resources = useMemo(
    () => professionalsToResources(activeProfessionals),
    [activeProfessionals],
  );

  /**
   * Um recurso é visível quando não está no mapa ou está com `true` — é a
   * convenção do próprio scheduler, e segui-la evita que o estado inicial
   * vazio esconda todo mundo.
   */
  const shownProfessionals = useMemo(
    () =>
      activeProfessionals.filter(
        (professional) => visibleResources[professional.id] !== false,
      ),
    [activeProfessionals, visibleResources],
  );

  /**
   * Os blocos "não atende" só fazem sentido com **um** profissional na tela:
   * numa grade compartilhada, uma faixa cinza não diz de quem é, e marcaria
   * como indisponível um horário livre para os demais.
   */
  const soloProfessional =
    shownProfessionals.length === 1 ? shownProfessionals[0] : null;

  const timeOff = useTimeOff(soloProfessional?.id ?? "", !!soloProfessional);

  const events = useMemo(
    () => appointmentsToEvents(appointments.appointments),
    [appointments.appointments],
  );

  const gridHours = useMemo(() => getGridHours(tenant), [tenant]);

  const offHoursEvents = useMemo(() => {
    if (!soloProfessional || !tenant) return [];

    return buildOffHoursEvents({
      professional: soloProfessional,
      timeOff: timeOff.timeOff,
      days: getVisibleDays(visibleDate, view),
      clinic: {
        businessDays: tenant.businessDays,
        businessHoursStart: tenant.businessHoursStart,
        businessHoursEnd: tenant.businessHoursEnd,
      },
      gridStartHour: gridHours.start,
      gridEndHour: gridHours.end,
    });
  }, [soloProfessional, tenant, timeOff.timeOff, visibleDate, view, gridHours]);

  const isTruncated =
    !!appointments.meta &&
    appointments.meta.total > appointments.appointments.length;

  return {
    view,
    setView,
    visibleDate,
    setVisibleDate,
    visibleResources,
    setVisibleResources,
    resources,
    /** Faixa de horas da grade — o expediente da clínica. */
    gridHours,
    // Os bloqueios entram antes para ficarem atrás dos agendamentos reais
    // quando o scheduler empilha eventos sobrepostos.
    events: [...offHoursEvents, ...events],
    /** Profissionais ativos — a legenda usa a grade (`schedules`) deles. */
    professionals: activeProfessionals,
    /** Não-nulo só quando exatamente um profissional está visível. */
    soloProfessional,
    isTruncated,
    isLoading: professionals.isLoading || appointments.isLoading,
    error: professionals.error ?? appointments.error,
    refetch: () => {
      void professionals.refetch();
      void appointments.refetch();
    },
  };
}
