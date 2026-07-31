export const MessagingMock = () => {
  return (
    <div className="flex min-h-80 flex-col justify-between">
      {/* WhatsApp header */}
      <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-tr from-emerald-500 to-teal-600 text-sm shadow-md">
            💬
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Clínica Vitalité</h4>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-gray-600">
                WhatsApp Business · API oficial
              </span>
            </div>
          </div>
        </div>
        <div className="rounded-full border border-black/10 bg-black/3 px-2.5 py-1 font-mono text-[10px] text-emerald-600">
          D-1 automático
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 space-y-3 text-xs">
        {/* Outgoing reminder */}
        <div className="flex justify-end">
          <div className="max-w-[88%] rounded-2xl rounded-tr-none border border-emerald-500/20 bg-linear-to-r from-emerald-50 to-teal-50 px-4 py-3 text-gray-700 shadow-md">
            <p className="leading-relaxed">
              Oi, Marina! 👋 Lembrando da sua{" "}
              <strong className="text-gray-900">limpeza de pele</strong> amanhã às{" "}
              <strong className="text-gray-900">09:00</strong> com a Dra. Helena.
            </p>
            <div className="mt-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center text-[11px] font-semibold text-emerald-600">
              ✓ Confirmar presença
            </div>
            <div className="mt-2 flex items-center justify-end gap-1 text-[9px] text-gray-500">
              18:00
              <svg className="h-3 w-3 text-sky-500" fill="currentColor" viewBox="0 0 16 15">
                <path d="M15.01 3.316l-.478-.372a.365.365 0 00-.51.063L8.666 9.879a.32.32 0 01-.484.033l-.358-.325a.319.319 0 00-.484.032l-.378.483a.418.418 0 00.036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 00-.064-.512zm-4.1 0l-.478-.372a.365.365 0 00-.51.063L4.566 9.879a.32.32 0 01-.484.033L1.891 7.769a.366.366 0 00-.515.006l-.423.433a.364.364 0 00.006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 00-.063-.51z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Incoming confirmation */}
        <div className="flex justify-start">
          <div className="max-w-[70%] rounded-2xl rounded-tl-none border border-black/10 bg-gray-100 px-4 py-3 text-gray-700 shadow-md">
            <p className="leading-relaxed">Confirmado! Estarei lá 😊</p>
            <div className="mt-1.5 text-right text-[9px] text-gray-500">18:04</div>
          </div>
        </div>

        {/* Status strip */}
        <div className="flex items-center justify-between rounded-xl border border-black/5 bg-black/3 p-3 text-[10px] text-gray-600">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span>Agendamento marcado como confirmado</span>
          </div>
          <span className="font-mono text-emerald-600">auto</span>
        </div>
      </div>

      {/* Retry / fallback */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/15 bg-amber-500/5 p-3">
        <svg
          className="h-4 w-4 shrink-0 text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <p className="text-[10px] leading-relaxed text-gray-600">
          <span className="font-semibold text-amber-600">Nunca falha em silêncio:</span> 4
          tentativas com backoff. Se nem assim entregar, o horário entra na lista da
          recepção pra ligar.
        </p>
      </div>
    </div>
  );
};
