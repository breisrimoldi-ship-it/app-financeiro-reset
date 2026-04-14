import { ArrowDownLeft, Calendar, CreditCard, Landmark, Tag } from "lucide-react";
import type { CategoryOption, Movimentacao } from "../_lib/types";
import {
  formatCompetencia,
  formatCurrency,
  formatDate,
  formatTipoPagamento,
  resolveCategoryLabel,
} from "../_lib/utils";
import { AcaoItem } from "./acao-item";

export function CardDespesaPremium({
  item,
  nomeCartao,
  categoryOptions,
  nomeConta,
  onEdit,
  onDelete,
  onOpen,
}: {
  item: Movimentacao;
  nomeCartao: string;
  categoryOptions: CategoryOption[];
  nomeConta?: string;
  onEdit: () => void;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const valorParcela =
    item.tipoPagamento === "credito" && item.parcelas
      ? item.valor / item.parcelas
      : null;

  const isCredito = item.tipoPagamento === "credito";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group w-full cursor-pointer rounded-[28px] border border-slate-200/80 bg-white px-5 py-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md md:px-6"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
          <ArrowDownLeft className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-slate-900">
                {item.descricao}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(item.data)}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                  <Tag className="h-3.5 w-3.5" />
                  {resolveCategoryLabel(item.categoria, categoryOptions)}
                </span>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                  {formatTipoPagamento(item.tipoPagamento ?? "pix_dinheiro")}
                </span>

                {isCredito && item.primeiraCobranca && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                    Fatura {formatCompetencia(item.primeiraCobranca)}
                  </span>
                )}

                {nomeConta && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                    <Landmark className="h-3.5 w-3.5" />
                    {nomeConta}
                  </span>
                )}
              </div>

              {isCredito && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    {nomeCartao}
                  </span>

                  {item.parcelas && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                      {item.parcelas}x
                    </span>
                  )}

                  {valorParcela && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                      Parcela {formatCurrency(valorParcela)}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-start gap-3">
              <div className="text-left sm:text-right">
                <p className="text-xl font-semibold tracking-tight text-rose-600">
                  - {formatCurrency(item.valor)}
                </p>

                {isCredito ? (
                  <p className="mt-1 text-[11px] text-slate-400">
                    não afeta o saldo agora
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    saída
                  </p>
                )}
              </div>

              <div
                className="opacity-100 transition md:opacity-0 md:group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <AcaoItem onEdit={onEdit} onDelete={onDelete} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
