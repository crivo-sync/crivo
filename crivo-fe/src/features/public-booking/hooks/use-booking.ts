"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createBookingAction,
  getAvailabilityAction,
  getBookingOptionsAction,
} from "../actions/public-booking-actions";
import type {
  Availability,
  BookingConfirmation,
  BookingOptions,
} from "../types";

/** `YYYY-MM-DD` no fuso local — nunca `toISOString()`, que joga para UTC e
 * pode voltar um dia dependendo da hora. */
export function toLocalDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Quais procedimentos este profissional faz. Lista vazia no cadastro
 * significa "faz todos" — a mesma regra do painel. */
export function proceduresFor(
  options: BookingOptions | null,
  professionalId: string,
): BookingOptions["procedures"] {
  if (!options) return [];

  const professional = options.professionals.find(
    (p) => p.id === professionalId,
  );
  if (!professional || professional.procedures.length === 0) {
    return options.procedures;
  }

  const allowed = new Set(professional.procedures.map((p) => p.id));
  return options.procedures.filter((p) => allowed.has(p.id));
}

/**
 * Estado do agendamento público, em cascata: profissional → procedimento →
 * dia → horário.
 *
 * A cascata não é preciosismo de UI: sem profissional e procedimento
 * escolhidos o backend não tem como calcular horário livre (a grade é de
 * quem atende, e a duração do procedimento define se o horário cabe). É a
 * mesma regra do formulário do painel.
 */
export function useBooking(subdomain: string) {
  const [options, setOptions] = useState<BookingOptions | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingOptions, setLoadingOptions] = useState(true);

  const [professionalId, setProfessionalId] = useState("");
  const [procedureId, setProcedureId] = useState("");
  const [date, setDate] = useState(() => toLocalDateInput(new Date()));

  /** Resultado da busca junto com a combinação que o gerou. */
  const [loaded, setLoaded] = useState<{
    key: string;
    availability: Availability | null;
  } | null>(null);

  const [confirmation, setConfirmation] =
    useState<BookingConfirmation | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getBookingOptionsAction(subdomain).then((result) => {
      if (!active) return;
      if (result.success) setOptions(result.data);
      else setLoadError(result.message);
      setLoadingOptions(false);
    });

    return () => {
      active = false;
    };
  }, [subdomain]);

  // Recarrega os horários sempre que a combinação muda. O `active` evita
  // que uma resposta antiga (rede lenta) sobrescreva uma escolha nova.
  //
  // Guarda a combinação **junto** com o resultado, em vez de manter estados
  // separados de "carregando" e "limpar o anterior": `setState` síncrono
  // dentro de effect dispara render em cascata (e o React Compiler reclama,
  // com razão). Com a chave no próprio dado, tanto `availability` quanto
  // `isLoadingSlots` viram valores derivados — nada para sincronizar.
  useEffect(() => {
    if (!professionalId || !procedureId || !date) return;

    let active = true;

    getAvailabilityAction(subdomain, { professionalId, procedureId, date }).then(
      (result) => {
        if (!active) return;
        setLoaded({
          key: `${professionalId}|${procedureId}|${date}`,
          availability: result.success ? result.data : null,
        });
      },
    );

    return () => {
      active = false;
    };
  }, [subdomain, professionalId, procedureId, date]);

  const selectionKey =
    professionalId && procedureId && date
      ? `${professionalId}|${procedureId}|${date}`
      : null;
  const isCurrent = selectionKey !== null && loaded?.key === selectionKey;

  // Resultado velho (de outra combinação) é ignorado na leitura.
  const availability = isCurrent ? loaded.availability : null;
  // Seleção completa cujo resultado ainda não chegou = carregando.
  const isLoadingSlots = selectionKey !== null && !isCurrent;

  /** Trocar de profissional invalida o procedimento se ele não o realiza. */
  const selectProfessional = useCallback(
    (id: string) => {
      setProfessionalId(id);
      const allowed = proceduresFor(options, id);
      if (!allowed.some((p) => p.id === procedureId)) setProcedureId("");
    },
    [options, procedureId],
  );

  /**
   * Volta ao formulário depois de marcar — para quem precisa de uma segunda
   * consulta (outro procedimento, ou marcar para um familiar).
   *
   * Zera a seleção inteira em vez de só esconder a confirmação: manter
   * profissional/procedimento/dia preenchidos do agendamento anterior faria a
   * pessoa marcar o mesmo horário de novo sem perceber. `options` fica —
   * é a lista da clínica, não escolha do paciente, e rebuscá-la só custaria
   * um request e uma tela em branco.
   */
  const reset = useCallback(() => {
    setConfirmation(null);
    setSubmitError(null);
    setProfessionalId("");
    setProcedureId("");
    setDate(toLocalDateInput(new Date()));
    setLoaded(null);
  }, []);

  const submit = useCallback(
    async (input: {
      patientName: string;
      patientPhone: string;
      startsAt: string;
      notes?: string;
    }) => {
      setSubmitting(true);
      setSubmitError(null);

      const result = await createBookingAction(subdomain, {
        ...input,
        professionalId,
        procedureId,
      });

      if (result.success) setConfirmation(result.data);
      else setSubmitError(result.message);

      setSubmitting(false);
    },
    [subdomain, professionalId, procedureId],
  );

  return {
    options,
    isLoadingOptions,
    loadError,

    professionalId,
    selectProfessional,
    procedureId,
    setProcedureId,
    date,
    setDate,

    availability,
    isLoadingSlots,

    confirmation,
    isSubmitting,
    submitError,
    submit,
    reset,
  };
}
