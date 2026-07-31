const RISK_ROWS = [
  {
    patient: "Carlos Menezes",
    time: "Amanhã · 08:00",
    reason: "2 faltas nos últimos 90 dias",
    score: 87,
    level: "Alto",
    levelClass: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    bar: "bg-rose-500",
  },
  {
    patient: "Patrícia Alves",
    time: "Amanhã · 11:30",
    reason: "1º atendimento · sem histórico",
    score: 54,
    level: "Médio",
    levelClass: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    bar: "bg-amber-500",
  },
  {
    patient: "Marina Costa",
    time: "Amanhã · 15:00",
    reason: "Sempre confirma em até 2h",
    score: 12,
    level: "Baixo",
    levelClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    bar: "bg-emerald-500",
  },
];

export const PredictionMock = () => {
  return (
    <div className="flex min-h-80 flex-col justify-between">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between border-b border-black/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-tr from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-md">
            🎯
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Risco de no-show</h4>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              <span className="text-[10px] text-gray-600">
                Analisando 1.284 atendimentos
              </span>
            </div>
          </div>
        </div>
        <div className="rounded-full border border-black/10 bg-black/3 px-2.5 py-1 font-mono text-[10px] text-indigo-500">
          Amanhã · 12 horários
        </div>
      </div>

      {/* Risk rows */}
      <div className="flex-1 space-y-3">
        {RISK_ROWS.map((row) => (
          <div
            key={row.patient}
            className="rounded-2xl border border-black/5 bg-gray-50 p-3.5 transition-transform duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-gray-900">
                  {row.patient}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-gray-500">
                  {row.time}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-sm font-bold text-gray-900">
                  {row.score}%
                </span>
                <span
                  className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold ${row.levelClass}`}
                >
                  {row.level}
                </span>
              </div>
            </div>

            {/* Score bar */}
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-black/5">
              <div
                className={`h-full rounded-full ${row.bar} transition-all duration-500`}
                style={{ width: `${row.score}%` }}
              />
            </div>

            <p className="mt-2 text-[10px] text-gray-500">{row.reason}</p>
          </div>
        ))}
      </div>

      {/* Action taken */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-indigo-500/10 bg-linear-to-r from-indigo-50 to-violet-50 p-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/20">
          <svg
            className="h-3.5 w-3.5 text-indigo-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <p className="text-[9px] font-semibold tracking-wider text-indigo-500 uppercase">
            Ação automática
          </p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-gray-600">
            Risco alto detectado para <span className="font-semibold text-gray-900">Carlos</span> — o
            Crivo disparou um lembrete reforçado e sinalizou o horário como{" "}
            <span className="font-semibold text-amber-600">candidato a encaixe</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
