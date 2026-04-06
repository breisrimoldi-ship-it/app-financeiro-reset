import type { SerieMensal } from "../_lib/types";
import { formatMoney, formatCompetenciaLabel } from "../_lib/utils";

export function HistoricoSection({
  serieMensal,
  serieComDados,
}: {
  serieMensal: SerieMensal[];
  serieComDados: SerieMensal[];
}) {
  const melhorMes =
    serieComDados.length > 0
      ? [...serieComDados].sort((a, b) => b.lucroLiquido - a.lucroLiquido)[0]
      : null;

  const piorMes =
    serieComDados.length > 0
      ? [...serieComDados].sort((a, b) => a.lucroLiquido - b.lucroLiquido)[0]
      : null;

  const mediaLucro =
    serieComDados.length > 0
      ? serieComDados.reduce((acc, m) => acc + m.lucroLiquido, 0) / serieComDados.length
      : 0;

  const ultimos3 = serieMensal.slice(-3);
  const anteriores3 = serieMensal.slice(-6, -3);

  const mediaUltimos3 =
    ultimos3.length > 0 ? ultimos3.reduce((a, m) => a + m.lucroLiquido, 0) / ultimos3.length : 0;
  const mediaAnteriores3 =
    anteriores3.length > 0
      ? anteriores3.reduce((a, m) => a + m.lucroLiquido, 0) / anteriores3.length
      : 0;

  const tendencia = mediaUltimos3 - mediaAnteriores3;

  const alertasHistorico: string[] = [];

  for (let i = 2; i < serieMensal.length; i += 1) {
    const a = serieMensal[i - 2].lucroLiquido;
    const b = serieMensal[i - 1].lucroLiquido;
    const c = serieMensal[i].lucroLiquido;
    if (a > b && b > c) {
      alertasHistorico.push(
        `Queda de lucro por 3 competências seguidas até ${formatCompetenciaLabel(serieMensal[i].mes)}.`
      );
      break;
    }
  }

  const atualHistorico = serieMensal[serieMensal.length - 1];
  if (atualHistorico && atualHistorico.receitas > 0) {
    const pctCustos = (atualHistorico.custos / atualHistorico.receitas) * 100;
    if (pctCustos >= 60) {
      alertasHistorico.push(
        `Custos estão em ${pctCustos.toFixed(1)}% da receita em ${formatCompetenciaLabel(
          atualHistorico.mes
        )}.`
      );
    }
  }

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-zinc-900">Fase 6 · Histórico e insights</h2>
        <p className="text-sm text-zinc-500">
          Visão dos últimos 12 meses da renda variável com tendências e alertas.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl bg-zinc-50 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Melhor mês</p>
          <p className="mt-2 text-sm font-semibold text-zinc-900">
            {melhorMes ? `${formatCompetenciaLabel(melhorMes.mes)} · R$ ${formatMoney(melhorMes.lucroLiquido)}` : "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-zinc-50 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Pior mês</p>
          <p className="mt-2 text-sm font-semibold text-zinc-900">
            {piorMes ? `${formatCompetenciaLabel(piorMes.mes)} · R$ ${formatMoney(piorMes.lucroLiquido)}` : "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-zinc-50 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Média lucro</p>
          <p className="mt-2 text-sm font-semibold text-zinc-900">R$ {formatMoney(mediaLucro)}</p>
        </div>
        <div className="rounded-2xl bg-zinc-50 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Tendência (3x3)</p>
          <p className={`mt-2 text-sm font-semibold ${tendencia >= 0 ? "text-emerald-700" : "text-red-700"}`}>
            {tendencia >= 0 ? "+" : "-"}R$ {formatMoney(Math.abs(tendencia))}
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200">
        <div className="grid grid-cols-5 bg-zinc-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
          <span>Mês</span>
          <span className="text-right">Receitas</span>
          <span className="text-right">Custos</span>
          <span className="text-right">Transferências</span>
          <span className="text-right">Lucro líquido</span>
        </div>
        <div className="divide-y divide-zinc-200 text-sm">
          {serieMensal.map((m) => (
            <div key={m.mes} className="grid grid-cols-5 px-4 py-3">
              <span className="text-zinc-700">{formatCompetenciaLabel(m.mes)}</span>
              <span className="text-right text-zinc-700">R$ {formatMoney(m.receitas + m.aportes)}</span>
              <span className="text-right text-zinc-700">R$ {formatMoney(m.custos)}</span>
              <span className="text-right text-zinc-700">R$ {formatMoney(m.transferencias)}</span>
              <span className="text-right font-medium text-zinc-900">R$ {formatMoney(m.lucroLiquido)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-medium text-zinc-900">Alertas inteligentes</p>
        {alertasHistorico.length === 0 ? (
          <p className="mt-1 text-sm text-zinc-600">Sem alertas críticos no histórico recente.</p>
        ) : (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
            {alertasHistorico.map((alerta) => (
              <li key={alerta}>{alerta}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
