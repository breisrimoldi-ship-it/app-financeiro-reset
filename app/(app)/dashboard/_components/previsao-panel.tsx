type Previsao = {
  saldoFinalPrevisto: number;
  gastoDiarioAtual: number;
  gastoDiarioPermitido: number;
  diasRestantes: number;
};

type Props = {
  previsao: Previsao;
  formatarMoeda: (valor: number) => string;
};

export function PrevisaoPanel({ previsao, formatarMoeda }: Props) {
  const isNegativo = previsao.saldoFinalPrevisto < 0;

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-zinc-900">Previsão do mês</h3>

      <div
        className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
          isNegativo
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}
      >
        {isNegativo
          ? `Projeção de fechamento: ${formatarMoeda(previsao.saldoFinalPrevisto)}`
          : `Projeção de fechamento: ${formatarMoeda(previsao.saldoFinalPrevisto)}`}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-xs text-zinc-500">Gasto médio/dia</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {formatarMoeda(previsao.gastoDiarioAtual)}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-xs text-zinc-500">Permitido/dia</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {formatarMoeda(previsao.gastoDiarioPermitido)}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-xs text-zinc-500">Dias restantes</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {previsao.diasRestantes}
          </p>
        </div>
      </div>
    </div>
  );
}
