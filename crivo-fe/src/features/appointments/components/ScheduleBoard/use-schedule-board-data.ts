"use client";

import { useMemo, useState } from "react";

import { useProfessionals } from "@/features/professionals/hooks/use-professionals";
import { useAppointments } from "../../hooks/use-appointments";
import { appointmentsToEvents, professionalsToResources } from "./map-to-scheduler";
import { getVisibleRange, type BoardView } from "./visible-range";

/**
 * Teto de 200 é o máximo aceito pela API por página. Uma clínica com mais
 * agendamentos que isso numa única semana é o caso raro que merece aviso na
 * tela, não paginação silenciosa escondendo parte da agenda.
 */
const MAX_APPOINTMENTS_PER_FETCH = 200;

export function useScheduleBoardData() {
  const [view, setView] = useState<BoardView>("week");
  const [visibleDate, setVisibleDate] = useState<Date>(() => new Date());

  const range = useMemo(() => getVisibleRange(visibleDate, view), [visibleDate, view]);

  const professionals = useProfessionals({ page: 1, perPage: 100 });

  const appointments = useAppointments({
    page: 1,
    perPage: MAX_APPOINTMENTS_PER_FETCH,
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  });

  const activeProfessionals = useMemo(
    () => professionals.professionals.filter((professional) => professional.isActive),
    [professionals.professionals],
  );

  const resources = useMemo(
    () => professionalsToResources(activeProfessionals),
    [activeProfessionals],
  );

  const events = useMemo(
    () => appointmentsToEvents(appointments.appointments),
    [appointments.appointments],
  );

  const isTruncated =
    !!appointments.meta && appointments.meta.total > appointments.appointments.length;

  return {
    view,
    setView,
    visibleDate,
    setVisibleDate,
    resources,
    events,
    isTruncated,
    isLoading: professionals.isLoading || appointments.isLoading,
    error: professionals.error ?? appointments.error,
    refetch: () => {
      void professionals.refetch();
      void appointments.refetch();
    },
  };
}
