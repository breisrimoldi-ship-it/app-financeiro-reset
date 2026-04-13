"use client";

import { X } from "lucide-react";
import type { CategoryOption, Movimentacao } from "../_lib/types";
import {
  formatCompetencia,
  formatCurrency,
  formatDate,
  formatTipoPagamento,
  resolveCategoryLabel,
} from "../_lib/utils";
import { DetalheItem } from "./detalhe-item";

export function ModalDetalhes({
  selectedItem,
  todasCategorias,
  cartoesMap,
  onClose,
  onEdit,
  onDelete,
}: {
  selectedItem: Movimentacao;
  todasCategorias: CategoryOption[];
  cartoesMap: Map<number, string>;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-4xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Detalhes da movimentação
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900">
                {selectedItem.descricao}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-6 px-6 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <DetalheItem
                label="Tipo"
                value={selectedItem.tipo === "entrada" ? "Entrada" : "Despesa"}
              />
              <DetalheItem
                label="Valor"
                value={formatCurrency(selectedItem.valor)}
                destaque={
                  selectedItem.tipo === "entrada"
                    ? "text-emerald-600"
                    : "text-rose-600"
                }
              />
              <DetalheItem label="Data" value={formatDate(selectedItem.data)} />
              <DetalheItem
                label="Categoria"
                value={resolveCategoryLabel(selectedItem.categoria, todasCategorias)}
              />
            </div>

            {selectedItem.tipo === "despesa" && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <h4 className="text-sm font-semibold text-slate-900">
                  Pagamento
                </h4>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <DetalheItem
                    label="Tipo de pagamento"
                    value={formatTipoPagamento(
                      selectedItem.tipoPagamento ?? "pix_dinheiro"
                    )}
                  />

                  {selectedItem.tipoPagamento === "credito" && (
                    <>
                      <DetalheItem
                        label="Cartão"
                        value={
                          selectedItem.cartaoId
                            ? (cartoesMap.get(selectedItem.cartaoId) ?? "-")
                            : "-"
                        }
                      />
                      <DetalheItem
                        label="Parcelas"
                        value={
                          selectedItem.parcelas
                            ? `${selectedItem.parcelas}x`
                            : "-"
                        }
                      />
                      <DetalheItem
                        label="Competência da fatura"
                        value={formatCompetencia(
                          selectedItem.primeiraCobranca ?? ""
                        )}
                      />
                      <DetalheItem
                        label="Valor da parcela"
                        value={
                          selectedItem.parcelas
                            ? formatCurrency(
                                selectedItem.valor / selectedItem.parcelas
                              )
                            : "-"
                        }
                      />
                    </>
                  )}
                </div>

                {selectedItem.tipoPagamento === "credito" && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Essa compra aparece na data em que foi feita, mas afeta o
                    financeiro na{" "}
                    <span className="font-semibold">
                      fatura {formatCompetencia(selectedItem.primeiraCobranca ?? "")}
                    </span>
                    .
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Fechar
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Editar
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
