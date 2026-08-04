"use client";

import { useState, useTransition } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

import { confirmAppointmentAction } from "@/features/confirmation/actions/confirm-appointment-action";
import type { ConfirmationPreview } from "@/features/confirmation/types";

dayjs.locale("pt-br");

type ConfirmationCardProps = {
  token: string;
  preview: ConfirmationPreview;
};

const TERMINAL_STATUS_MESSAGE: Partial<Record<ConfirmationPreview["status"], string>> = {
  CANCELLED: "Este agendamento foi cancelado.",
  COMPLETED: "Este atendimento já foi concluído.",
  NO_SHOW: "Este agendamento não está mais disponível para confirmação.",
};

export const ConfirmationCard = ({ token, preview }: ConfirmationCardProps) => {
  const [confirmed, setConfirmed] = useState(preview.alreadyConfirmed);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const terminalMessage = TERMINAL_STATUS_MESSAGE[preview.status];
  const canConfirm = !confirmed && !terminalMessage;

  const handleConfirm = () => {
    setError(undefined);
    startTransition(async () => {
      const result = await confirmAppointmentAction(token);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setConfirmed(true);
    });
  };

  return (
    <div className="w-full max-w-sm rounded-3xl border border-black/8 bg-white p-7 shadow-xl shadow-indigo-950/5">
      <p className="text-xs font-semibold tracking-wide text-indigo-600 uppercase">
        {preview.clinic}
      </p>
      <h1 className="mt-1 text-xl font-bold text-gray-900">
        Olá, {preview.patient.split(" ")[0]}
      </h1>

      <dl className="mt-6 space-y-3 border-t border-b border-black/8 py-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Procedimento</dt>
          <dd className="text-right font-medium text-gray-900">
            {preview.procedure}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Profissional</dt>
          <dd className="text-right font-medium text-gray-900">
            {preview.professional}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Quando</dt>
          <dd className="text-right font-medium text-gray-900">
            {dayjs(preview.startsAt).format("DD/MM [às] HH:mm")}
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        {confirmed ? (
          <div className="flex items-center justify-center gap-2 rounded-full bg-emerald-50 py-3.5 text-sm font-semibold text-emerald-700">
            <span aria-hidden>✅</span> Presença confirmada
          </div>
        ) : terminalMessage ? (
          <p className="text-center text-sm text-gray-500">{terminalMessage}</p>
        ) : (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="flex w-full items-center justify-center rounded-full bg-indigo-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
          >
            {isPending ? "Confirmando…" : "Confirmar presença"}
          </button>
        )}

        {error && (
          <p role="alert" className="mt-3 text-center text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      {canConfirm && (
        <p className="mt-4 text-center text-xs text-gray-400">
          Precisa remarcar ou cancelar? Fale direto com a clínica.
        </p>
      )}
    </div>
  );
};
