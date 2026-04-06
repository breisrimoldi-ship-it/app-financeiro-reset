import React from "react";
import { Plus } from "lucide-react";
import type { InteligenciaMetas } from "../_lib/types";
import { formatarMoeda } from "../_lib/utils";

export function InteligenciaMetasSection({
  inteligencia,
  onAporteInteligente,
}: {
  inteligencia: InteligenciaMetas;
  onAporteInteligente: () => void;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
          Inteligência
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
          Prioridade entre metas
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          O app destaca automaticamente qual meta merece mais atenção agora.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-rose-600">
            Mais urgente
          </p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {inteligencia.maisUrgente.nome}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Falta {formatarMoeda(inteligencia.maisUrgente.faltante)}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-600">
            Mais próxima
          </p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {inteligencia.maisProxima.nome}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Falta {formatarMoeda(inteligencia.maisProxima.faltante)}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-amber-600">
            Mais atrasada
          </p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {inteligencia.maisAtrasada.nome}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {inteligencia.maisAtrasada.percentual.toFixed(0)}% concluída
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <div>
          <p className="text-sm font-medium text-slate-900">
            Sugestão de aporte agora
          </p>
          <p className="text-sm text-slate-500">
            {inteligencia.maisUrgente.nome} • {formatarMoeda(inteligencia.valorSugerido)}
          </p>
        </div>

        <button
          type="button"
          onClick={onAporteInteligente}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Aportar agora
        </button>
      </div>
    </section>
  );
}
