import {
  AlarmClock,
  Calendar,
  CheckCircle2,
  CreditCard,
  Pencil,
  Power,
  Tag,
  Trash2,
} from "lucide-react";
import type { ContaCardProps } from "../_lib/types";
import {
  cls,
  contaAtivaNoMes,
  contaExisteNoMes,
  formatarData,
  formatarMesAno,
  formatarMoeda,
  getMesesRestantes,
  pagamentoEhAdiantado,
} from "../_lib/utils";

export function ContaCard({
  conta,
  mesSelecionado,
  pagamentoMes,
  estaPagando,
  onEditar,
  onPagar,
  onDesfazerPagamento,
  onAlternarStatus,
  onExcluir,
}: ContaCardProps) {
  const entraNoMes = contaAtivaNoMes(conta, mesSelecionado);
  const existeNoMes = contaExisteNoMes(conta, mesSelecionado);
  const pago = !!pagamentoMes && pagamentoMes.status === "paga";
  const adiantado = pagamentoEhAdiantado(pagamentoMes, mesSelecionado);
  const mesesRestantes = getMesesRestantes(conta, mesSelecionado);
  const totalRestante =
    conta.tipo_recorrencia === "temporaria"
      ? Number(conta.valor) * mesesRestantes
      : 0;

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={cls(
                "flex h-11 w-11 items-center justify-center rounded-2xl",
                conta.ativa
                  ? "bg-blue-50 text-blue-600"
                  : "bg-slate-100 text-slate-500"
              )}
            >
              <CreditCard className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-900">
                {conta.descricao}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                <span
                  className={cls(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium",
                    conta.ativa
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-700"
                  )}
                >
                  {conta.ativa ? "Ativa" : "Inativa"}
                </span>

                <span
                  className={cls(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium",
                    conta.tipo_recorrencia === "temporaria"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-700"
                  )}
                >
                  {conta.tipo_recorrencia === "temporaria"
                    ? "Temporária"
                    : "Recorrente"}
                </span>

                {pago ? (
                  <span
                    className={cls(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium",
                      adiantado
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {adiantado ? "Paga adiantada" : "Paga"}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              <Calendar className="h-3.5 w-3.5" />
              Vence dia {conta.dia_vencimento}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              <AlarmClock className="h-3.5 w-3.5" />
              Início {formatarMesAno(conta.inicio_cobranca)}
            </span>

            {conta.categoria ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                <Tag className="h-3.5 w-3.5" />
                {conta.categoria}
              </span>
            ) : null}

            <span
              className={cls(
                "rounded-full px-2.5 py-1 text-[11px] font-medium",
                existeNoMes
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-500"
              )}
            >
              {existeNoMes
                ? `Existe em ${formatarMesAno(mesSelecionado)}`
                : `Fora de ${formatarMesAno(mesSelecionado)}`}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            {conta.tipo_recorrencia === "temporaria" ? (
              <>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  Prazo:{" "}
                  {conta.quantidade_meses
                    ? `${conta.quantidade_meses} mês(es)`
                    : `até ${formatarMesAno(conta.fim_cobranca)}`}
                </span>

                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  Restante: {formatarMoeda(totalRestante)}
                </span>

                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  {mesesRestantes} mês(es) restantes
                </span>
              </>
            ) : (
              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                Cobrança contínua
              </span>
            )}

            {pago && pagamentoMes?.data_pagamento ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                Pago em {formatarData(pagamentoMes.data_pagamento)}
              </span>
            ) : null}
          </div>

          {conta.observacoes ? (
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {conta.observacoes}
            </p>
          ) : null}

          {entraNoMes ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {pago ? (
                <button
                  type="button"
                  onClick={onDesfazerPagamento}
                  disabled={estaPagando}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {estaPagando ? "Desfazendo..." : "Desfazer pagamento"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onPagar}
                  disabled={estaPagando}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {estaPagando ? "Pagando..." : "Pagar"}
                </button>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
          <div className="text-left lg:text-right">
            <p className="text-xl font-semibold text-slate-900">
              {formatarMoeda(Number(conta.valor))}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
              conta
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onEditar}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </button>

            <button
              type="button"
              onClick={onAlternarStatus}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <Power className="h-4 w-4" />
              {conta.ativa ? "Inativar" : "Ativar"}
            </button>

            <button
              type="button"
              onClick={onExcluir}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
