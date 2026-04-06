import React from "react";
import {
  Plus,
  Pencil,
  Trash2,
  PauseCircle,
  CheckCircle2,
  ArrowUpRight,
  History,
} from "lucide-react";
import type { MetaCalculada, MetaStatus } from "../_lib/types";
import { classNames, formatarMoeda, getStatusLabel } from "../_lib/utils";

export function MetaCard({
  meta,
  onAporte,
  onHistorico,
  onEditar,
  onPausar,
  onReativar,
  onConcluir,
  onExcluir,
}: {
  meta: MetaCalculada;
  onAporte: (meta: MetaCalculada) => void;
  onHistorico: (meta: MetaCalculada) => void;
  onEditar: (meta: MetaCalculada) => void;
  onPausar: (meta: MetaCalculada) => void;
  onReativar: (meta: MetaCalculada) => void;
  onConcluir: (meta: MetaCalculada) => void;
  onExcluir: (meta: MetaCalculada) => void;
}) {
  const statusClasses =
    meta.status === "ativa"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : meta.status === "pausada"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : meta.status === "concluida"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                {meta.nome}
              </h3>

              <span
                className={classNames(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  statusClasses
                )}
              >
                {getStatusLabel(meta.status)}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {meta.tipo ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  {meta.tipo}
                </span>
              ) : null}

              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                Prioridade {meta.prioridadeLabel}
              </span>

              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                {meta.prazoFormatado}
              </span>

              {meta.considerar_na_dashboard ? (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                  Na dashboard
                </span>
              ) : null}
            </div>

            {meta.descricao ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                {meta.descricao}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onAporte(meta)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              <Plus className="h-4 w-4" />
              Aportar
            </button>

            <button
              type="button"
              onClick={() => onHistorico(meta)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <History className="h-4 w-4" />
              Histórico
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Guardado
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {formatarMoeda(meta.valorAtualCalculado)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Meta
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {formatarMoeda(meta.valorMetaNumero)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Falta
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {formatarMoeda(meta.faltante)}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-700">Progresso</p>
            <p className="text-sm font-semibold text-slate-900">
              {meta.percentual.toFixed(0)}%
            </p>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{ width: `${meta.percentual}%` }}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Ritmo atual
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {formatarMoeda(meta.mediaMensalAportes)}/mês
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Média com base no histórico de aportes
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Previsão
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {meta.previsaoConclusaoTexto}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Estimativa com base no seu ritmo atual
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Ideal por mês
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {meta.valorIdealMensal !== null
                ? `${formatarMoeda(meta.valorIdealMensal)}/mês`
                : "Sem prazo"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Para cumprir a meta até o prazo
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => onEditar(meta)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>

          {meta.status !== "pausada" ? (
            <button
              type="button"
              onClick={() => onPausar(meta)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
            >
              <PauseCircle className="h-4 w-4" />
              Pausar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onReativar(meta)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              <ArrowUpRight className="h-4 w-4" />
              Reativar
            </button>
          )}

          {meta.status !== "concluida" ? (
            <button
              type="button"
              onClick={() => onConcluir(meta)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
            >
              <CheckCircle2 className="h-4 w-4" />
              Concluir
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => onExcluir(meta)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
