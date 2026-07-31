const PROFESSIONALS = [
  { name: "Dra. Helena Braga", role: "Dermatologia", active: true },
  { name: "Dr. Paulo Sato", role: "Odontologia", active: true },
  { name: "Dra. Íris Nunes", role: "Estética facial", active: true },
  { name: "Dr. Bruno Alves", role: "Inativo neste mês", active: false },
];

const BREAKDOWN = [
  { label: "Plano Clínica (até 3 profissionais)", value: "R$ 289,00" },
  { label: "Profissional extra × 0", value: "R$ 0,00" },
];

export const BillingMock = () => {
  return (
    <div className="flex min-h-75 flex-col justify-between">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-wider text-gray-500 uppercase">
            Assinatura · agosto
          </p>
          <h4 className="mt-0.5 text-sm font-bold text-gray-900">Clínica Vitalité</h4>
        </div>
        <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
          Ativa
        </span>
      </div>

      {/* Total card */}
      <div className="rounded-2xl border border-cyan-500/10 bg-linear-to-r from-cyan-50 to-sky-50 p-4">
        <p className="text-[10px] tracking-wider text-gray-500 uppercase">
          Total deste mês
        </p>
        <div className="mt-1 flex items-end justify-between">
          <p className="text-2xl font-bold text-gray-900">R$ 289,00</p>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-cyan-600">
              3 profissionais ativos
            </span>
          </div>
        </div>
        <div className="mt-3 space-y-1.5 border-t border-black/5 pt-3">
          {BREAKDOWN.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500">{row.label}</span>
              <span className="font-mono text-[10px] text-gray-700">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Professionals list */}
      <div className="mt-4 flex-1 space-y-2">
        {PROFESSIONALS.map((pro) => (
          <div
            key={pro.name}
            className={`flex items-center justify-between rounded-xl border p-2.5 transition-colors ${
              pro.active
                ? "border-black/5 bg-black/3"
                : "border-black/5 bg-transparent opacity-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  pro.active ? "bg-cyan-500" : "bg-gray-400"
                }`}
              />
              <div>
                <p className="text-[11px] font-semibold text-gray-900">{pro.name}</p>
                <p className="text-[9px] text-gray-500">{pro.role}</p>
              </div>
            </div>
            <span
              className={`font-mono text-[9px] ${
                pro.active ? "text-cyan-600" : "text-gray-500"
              }`}
            >
              {pro.active ? "cobrado" : "não cobrado"}
            </span>
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-cyan-500/10 bg-cyan-500/5 p-3 text-[10px] text-cyan-600">
        <svg
          className="h-4 w-4 shrink-0 text-cyan-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          Dr. Bruno ficou inativo neste mês e não entrou na conta — você paga por
          profissional ativo, não por agendamento.
        </span>
      </div>
    </div>
  );
};
