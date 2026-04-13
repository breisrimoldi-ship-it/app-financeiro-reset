import type { ChartPoint } from "../_lib/types";
import { formatarMoeda } from "../_lib/utils";

export function MiniBarChart({ data }: { data: ChartPoint[] }) {
  const maxValor = Math.max(
    1,
    ...data.flatMap((item) => [item.entradas, item.saidas, Math.abs(item.saldo)])
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
        <div className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Entradas
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          Saidas
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {data.map((item) => (
          <div key={item.mes} className="flex flex-col items-center gap-3">
            <div className="flex h-52 items-end gap-1.5">
              <div
                className="w-4 rounded-t-2xl bg-emerald-500/90 transition-all"
                style={{
                  height: `${(item.entradas / maxValor) * 100}%`,
                  minHeight: item.entradas > 0 ? 10 : 0,
                }}
              />
              <div
                className="w-4 rounded-t-2xl bg-rose-500/90 transition-all"
                style={{
                  height: `${(item.saidas / maxValor) * 100}%`,
                  minHeight: item.saidas > 0 ? 10 : 0,
                }}
              />
            </div>

            <div className="text-center">
              <p className="text-xs font-medium text-zinc-700">{item.label}</p>
              <p
                className={`mt-1 text-[11px] font-medium ${
                  item.saldo >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {formatarMoeda(item.saldo)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
