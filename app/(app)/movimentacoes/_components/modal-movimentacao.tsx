"use client";

import { Tag, X } from "lucide-react";
import type {
  Cartao,
  CategoryOption,
  ContaBancaria,
  FormData,
  FormType,
  PaymentType,
} from "../_lib/types";
import { formatCompetencia } from "../_lib/utils";

export function ModalMovimentacao({
  sheetTitle,
  sheetDescription,
  formType,
  setFormType,
  formData,
  setFormData,
  categoriasAtuais,
  cartoes,
  editingId,
  primeiraCobrancaSugerida,
  onClose,
  onSubmit,
  onOpenCategorias,
  contasBancarias,
}: {
  sheetTitle: string;
  sheetDescription: string;
  formType: FormType;
  setFormType: (t: FormType) => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  categoriasAtuais: CategoryOption[];
  cartoes: Cartao[];
  editingId: number | null;
  primeiraCobrancaSugerida: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onOpenCategorias: (tab: FormType) => void;
  contasBancarias?: ContaBancaria[];
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {sheetTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {sheetDescription}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form
            onSubmit={onSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <div className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50/60 p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Dados principais
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Registre a movimentação com descrição, valor, data e categoria.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenCategorias(formType)}
                    className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    <Tag className="mr-2 h-4 w-4" />
                    Gerenciar categorias
                  </button>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-700">
                    Tipo
                  </label>

                  <div className="flex gap-2 rounded-2xl bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setFormType("entrada")}
                      className={
                        formType === "entrada"
                          ? "flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm"
                          : "flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
                      }
                    >
                      Entrada
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormType("despesa")}
                      className={
                        formType === "despesa"
                          ? "flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm"
                          : "flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
                      }
                    >
                      Despesa
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                      Descrição
                    </label>
                    <input
                      type="text"
                      placeholder="Ex.: Corridas Uber, Mercado, Salário..."
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          descricao: e.target.value,
                        }))
                      }
                      className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">
                      Valor
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.valor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          valor: e.target.value,
                        }))
                      }
                      className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">
                      Data
                    </label>
                    <input
                      type="date"
                      value={formData.data}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          data: e.target.value,
                        }))
                      }
                      className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div className="grid gap-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                      Categoria
                    </label>
                    <select
                      value={formData.categoria}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          categoria: e.target.value,
                        }))
                      }
                      className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                    >
                      <option value="">Selecione</option>
                      {categoriasAtuais.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {contasBancarias && contasBancarias.length > 0 && (
                    <div className="grid gap-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">
                        Conta bancária{" "}
                        <span className="font-normal text-slate-400">(opcional)</span>
                      </label>
                      <select
                        value={formData.contaId}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contaId: e.target.value,
                          }))
                        }
                        className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                      >
                        <option value="">Nenhuma</option>
                        {contasBancarias.map((conta) => (
                          <option key={conta.id} value={conta.id}>
                            {conta.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {formType === "despesa" && (
                <div className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50/60 p-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Pagamento
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Defina como essa despesa afeta o financeiro real.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">
                      Tipo de pagamento
                    </label>
                    <select
                      value={formData.tipoPagamento}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tipoPagamento: e.target.value as PaymentType,
                          cartaoId:
                            e.target.value === "credito" ? prev.cartaoId : "",
                          parcelas:
                            e.target.value === "credito" ? prev.parcelas : "",
                          primeiraCobranca:
                            e.target.value === "credito"
                              ? prev.primeiraCobranca
                              : "",
                        }))
                      }
                      className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                    >
                      <option value="pix_dinheiro">PIX / Dinheiro</option>
                      <option value="debito">Cartão de Débito</option>
                      <option value="credito">Cartão de Crédito</option>
                    </select>
                  </div>

                  {formData.tipoPagamento === "credito" && (
                    <>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700">
                          Cartão
                        </label>
                        <select
                          value={formData.cartaoId}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              cartaoId: e.target.value,
                            }))
                          }
                          className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                        >
                          <option value="">Selecione</option>
                          {cartoes.map((cartao) => (
                            <option key={cartao.id} value={cartao.id}>
                              {cartao.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">
                            Parcelas
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.parcelas}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                parcelas: e.target.value,
                              }))
                            }
                            className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                          />
                        </div>

                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">
                            Primeira cobrança
                          </label>
                          <input
                            type="month"
                            value={
                              formData.primeiraCobranca || primeiraCobrancaSugerida
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                primeiraCobranca: e.target.value,
                              }))
                            }
                            className="h-12 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Essa despesa vai aparecer no seu histórico na data da compra,
                        mas entra na{" "}
                        <span className="font-semibold">
                          fatura {formatCompetencia(
                            formData.primeiraCobranca || primeiraCobrancaSugerida
                          )}
                        </span>
                        .
                      </div>
                    </>
                  )}
                </div>
              )}
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
                {editingId !== null ? "Salvar alterações" : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
