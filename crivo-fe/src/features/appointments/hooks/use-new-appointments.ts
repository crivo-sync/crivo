"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { LIVE_REFETCH_INTERVAL_MS } from "@/lib/realtime";
import { getNewAppointmentsCountAction } from "../actions/get-new-appointments-count-action";
import type { Appointment } from "../types";

/**
 * O que chegou depois que a tela abriu.
 *
 * A recepção deixa a Agenda aberta o dia inteiro e o paciente marca sozinho
 * pelo `/agendar` a qualquer hora. Sem aviso, a linha nova entra na tabela em
 * silêncio e quem não estava olhando na hora exata não percebe.
 *
 * **Duas fontes, de propósito:**
 *
 * - **`count`** vem do backend (`/appointments/new-count?since=`). É o número
 *   do aviso, e precisa ser server-side porque a lista é ordenada por data de
 *   atendimento: quem marca hoje para daqui a duas semanas cai numa página
 *   posterior, e um contador que só olhasse a página carregada nunca veria a
 *   chegada — que é o caso comum.
 * - **`newIds`** é local, só para destacar a linha **quando ela está na
 *   página visível**. Não dá para derivar do contador: o backend devolve
 *   quantos, não quais.
 *
 * Por isso o aviso pode dizer "2 novos" com nenhuma linha destacada — os dois
 * estão em outra página. É informação correta: avisa que chegou algo mesmo
 * quando não dá para mostrar onde.
 */
export function useNewAppointments(appointments: Appointment[]) {
  /**
   * Instante em que a tela abriu — a régua do "novo".
   *
   * `useState` com inicializador lazy, não `useRef`: o valor é lido durante o
   * render (entra na `queryKey`), e ler `ref.current` no render é justamente
   * o que o `react-hooks/refs` proíbe. Nunca é atualizado — o `setState` é
   * descartado de propósito.
   */
  const [since] = useState(() => new Date().toISOString());

  /** Ids já vistos, para diferenciar linha nova de linha que já estava. */
  const knownIds = useRef<Set<string> | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  /** Zerado ao reconhecer o aviso: o contador do servidor não sabe disso. */
  const [dismissedAt, setDismissedAt] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["appointments", "new-count", since, dismissedAt],
    queryFn: async () => {
      const result = await getNewAppointmentsCountAction(
        dismissedAt ?? since,
      );
      // Falha aqui não pode derrubar a Agenda — é um aviso auxiliar.
      if (!result.success) return { count: 0 };
      return result.data;
    },
    refetchInterval: LIVE_REFETCH_INTERVAL_MS,
  });

  useEffect(() => {
    // O primeiro carregamento devolve lista vazia; tratá-la como "estado
    // conhecido" faria a página inteira acender como nova no poll seguinte.
    if (appointments.length === 0 && knownIds.current === null) return;

    if (knownIds.current === null) {
      knownIds.current = new Set(appointments.map((a) => a.id));
      return;
    }

    const known = knownIds.current;
    const chegaram = appointments.map((a) => a.id).filter((id) => !known.has(id));

    if (chegaram.length === 0) return;

    for (const id of chegaram) known.add(id);
    setNewIds((atual) => new Set([...atual, ...chegaram]));
  }, [appointments]);

  const clear = () => {
    // Move a régua para agora: o que já foi avisado para de contar.
    setDismissedAt(new Date().toISOString());
    setNewIds(new Set());
  };

  return { count: data?.count ?? 0, newIds, clear };
}
