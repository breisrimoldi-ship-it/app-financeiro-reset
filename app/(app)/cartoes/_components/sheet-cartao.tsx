"use client";

import type { ChangeEvent, FormEvent } from "react";
import { X } from "lucide-react";
import { FieldBlock } from "./ui-primitives";

type SheetCartaoProps = {
  aberto: boolean;
  idEmEdicao: number | null;
  nome: string;
  limite: string;
  fechamentoDia: string;
  vencimentoDia: string;
  onNomeChange: (value: string) => void;
  onLimiteChange: (value: string) => void;
  onFechamentoDiaChange: (value: string) => void;
  onVencimentoDiaChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function SheetCartao({
  aberto,
  idEmEdicao,
  nome,
  limite,
  fechamentoDia,
  vencimentoDia,
  onNomeChange,
  onLimiteChange,
  onFechamentoDiaChange,
  onVencimentoDiaChange,
  onClose,
  onSubmit,
}: SheetCartaoProps) {
  if (!aberto) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {idEmEdicao !== null ? "Editar cartão" : "Novo cartão"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Cadastre o cartão com limite, fechamento e vencimento.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-1 flex-col overflow-y-auto"
        >
          <div className="space-y-6 px-6 py-6">
            <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Dados do cartão
              </h3>

              <FieldBlock label="Nome do cartão" htmlFor="nome">
                <input
                  id="nome"
                  type="text"
                  placeholder="Ex: Nubank"
                  value={nome}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onNomeChange(e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                />
              </FieldBlock>

              <FieldBlock label="Limite" htmlFor="limite">
                <input
                  id="limite"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1500.00"
                  value={limite}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onLimiteChange(e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                />
              </FieldBlock>

              <div className="grid gap-4 md:grid-cols-2">
                <FieldBlock label="Dia de fechamento" htmlFor="fechamentoDia">
                  <input
                    id="fechamentoDia"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ex: 5"
                    value={fechamentoDia}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      onFechamentoDiaChange(e.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                  />
                </FieldBlock>

                <FieldBlock label="Dia de vencimento" htmlFor="vencimentoDia">
                  <input
                    id="vencimentoDia"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ex: 12"
                    value={vencimentoDia}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      onVencimentoDiaChange(e.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                  />
                </FieldBlock>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                Esse cadastro define o limite do cartão e a regra base de fechamento
                e vencimento usada nas projeções de fatura.
              </div>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-95"
            >
              {idEmEdicao !== null ? "Atualizar cartão" : "Salvar cartão"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
