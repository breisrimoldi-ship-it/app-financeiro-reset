"use client";

import type { ChangeEvent } from "react";
import { X } from "lucide-react";
import type { ModalPagamentoState } from "../_lib/types";
import { moeda, formatarMes } from "../_lib/utils";
import { MiniResumoBox, FieldBlock } from "./ui-primitives";

type ModalPagamentoProps = {
  modalPagamento: ModalPagamentoState;
  valorPagamentoModal: string;
  salvandoPagamentoModal: boolean;
  onValorChange: (value: string) => void;
  onClose: () => void;
  onConfirmar: () => void;
};

export function ModalPagamento({
  modalPagamento,
  valorPagamentoModal,
  salvandoPagamentoModal,
  onValorChange,
  onClose,
  onConfirmar,
}: ModalPagamentoProps) {
  if (!modalPagamento.aberto) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Pagamento de fatura
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {modalPagamento.cartaoNome} • {formatarMes(modalPagamento.mesReferencia)}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={salvandoPagamentoModal}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-5 px-6 py-6">
            <div className="grid gap-3 md:grid-cols-3">
              <MiniResumoBox
                label="Total da fatura"
                value={moeda(modalPagamento.valorTotal)}
              />
              <MiniResumoBox
                label="Já pago"
                value={moeda(modalPagamento.valorPagoAtual)}
                valueClassName={
                  modalPagamento.valorPagoAtual > 0 ? "text-blue-600" : undefined
                }
              />
              <MiniResumoBox
                label="Restante"
                value={moeda(modalPagamento.valorRestante)}
                valueClassName="text-amber-600"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <FieldBlock label="Valor do pagamento" htmlFor="valorPagamentoModal">
                <input
                  id="valorPagamentoModal"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={modalPagamento.valorRestante}
                  placeholder="Digite o valor a pagar"
                  value={valorPagamentoModal}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onValorChange(e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                />
              </FieldBlock>

              <p className="mt-3 text-xs text-slate-500">
                Você pode lançar um pagamento parcial. Quando o total pago alcançar o
                valor da fatura, ela será marcada como quitada.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={salvandoPagamentoModal}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onConfirmar}
              disabled={salvandoPagamentoModal}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvandoPagamentoModal ? "Salvando..." : "Confirmar pagamento"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
