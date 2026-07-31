const APPOINTMENTS = [
  {
    time: "09:00",
    patient: "Marina Costa",
    procedure: "Limpeza de pele profunda",
    duration: "60 min",
    price: "R$ 220",
    status: "Confirmado",
    statusClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    bar: "from-emerald-500 to-teal-500",
  },
  {
    time: "10:30",
    patient: "Rafael Lima",
    procedure: "Clareamento dental",
    duration: "90 min",
    price: "R$ 890",
    status: "Aguardando",
    statusClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    bar: "from-amber-500 to-orange-500",
  },
  {
    time: "14:00",
    patient: "Juliana Reis",
    procedure: "Aplicação de toxina",
    duration: "45 min",
    price: "R$ 1.150",
    status: "Confirmado",
    statusClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    bar: "from-emerald-500 to-teal-500",
  },
];

export const AgendaMock = () => {
  return (
    <div className="flex min-h-75 flex-col justify-between">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-wider text-gray-500 uppercase">
            Agenda do dia
          </p>
          <h4 className="mt-0.5 text-sm font-bold text-gray-900">
            Quarta, 12 de agosto
          </h4>
        </div>
        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 font-mono text-[10px] text-amber-300">
          Dra. Helena · 3 horários
        </span>
      </div>

      {/* Appointments */}
      <div className="flex-1 space-y-2.5">
        {APPOINTMENTS.map((appt) => (
          <div
            key={appt.time}
            className="relative flex items-center gap-4 overflow-hidden rounded-2xl border border-black/5 bg-gray-50 p-4 backdrop-blur-md transition-transform duration-300 hover:scale-[1.02]"
          >
            <div
              className={`absolute top-0 bottom-0 left-0 w-[3px] bg-linear-to-b ${appt.bar} opacity-70`}
            />
            <div className="w-12 shrink-0 pl-1">
              <p className="font-mono text-sm font-bold text-gray-900">{appt.time}</p>
              <p className="mt-0.5 text-[9px] text-gray-500">{appt.duration}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-900">
                {appt.patient}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-gray-500">
                {appt.procedure}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-xs font-bold text-gray-900">{appt.price}</p>
              <span
                className={`mt-1 inline-block rounded border px-1.5 py-0.5 text-[9px] font-semibold ${appt.statusClass}`}
              >
                {appt.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Conflict blocked */}
      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
        <svg
          className="h-4 w-4 shrink-0 text-rose-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
        <p className="text-[10px] leading-relaxed text-gray-600">
          <span className="font-semibold text-rose-500">Conflito bloqueado:</span>{" "}
          10:30 já ocupado por Rafael Lima — o sistema recusou a sobreposição
          automaticamente.
        </p>
      </div>
    </div>
  );
};
