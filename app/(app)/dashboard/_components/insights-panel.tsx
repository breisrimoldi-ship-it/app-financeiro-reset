type InsightsItem = {
  tipo: "alerta" | "positivo" | "neutro";
  texto: string;
};

type Previsao = {
  saldoFinalPrevisto: number;
  gastoDiarioAtual: number;
};

type Props = {
  insights: InsightsItem[];
  previsao: Previsao;
  formatarMoeda: (valor: number) => string;
};

export function InsightsPanel({ insights, previsao, formatarMoeda }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-zinc-900">Situação do mês</h3>

      {insights.map((item, i) => {
        const estilo =
          item.tipo === "alerta"
            ? "border-red-200 bg-red-50 text-red-700"
            : item.tipo === "positivo"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-zinc-200 bg-zinc-50 text-zinc-700";

        return (
          <div
            key={`insight-${i}`}
            className={`rounded-2xl border px-4 py-3 text-sm font-medium ${estilo}`}
          >
            {item.texto}
          </div>
        );
      })}

      <div
        className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
          previsao.saldoFinalPrevisto < 0
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}
      >
        {previsao.saldoFinalPrevisto < 0
          ? `Se continuar assim, você fechará o mês com ${formatarMoeda(
              previsao.saldoFinalPrevisto
            )}`
          : `Você terminará o mês com aproximadamente ${formatarMoeda(
              previsao.saldoFinalPrevisto
            )}`}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
        Gasto médio diário: <strong>{formatarMoeda(previsao.gastoDiarioAtual)}</strong>
      </div>
    </div>
  );
}
