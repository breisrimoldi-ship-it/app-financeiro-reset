"use client";

import React, { useMemo } from "react";
import { X } from "lucide-react";
import { getCategoryOptions } from "@/lib/finance/categories";
import type { FormType, ActionFormData, PaymentType, Cartao } from "../_lib/types";
import { calcularPrimeiraCobranca } from "../_lib/utils";

export function ModalLancamentoDashboard({
  open,
  onClose,
  onSave,
  formType,
  setFormType,
  formData,
  setFormData,
  cartoes,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  formType: FormType;
  setFormType: (value: FormType) => void;
  formData: ActionFormData;
  setFormData: React.Dispatch<React.SetStateAction<ActionFormData>>;
  cartoes: Cartao[];
  saving: boolean;
}) {
  const categoriasAtuais = getCategoryOptions(formType);

  const primeiraCobrancaSugerida = useMemo(() => {
    if (formType !== "despesa") return "";
    if (formData.tipoPagamento !== "credito") return "";
    if (!formData.data || !formData.cartaoId) return "";

    return calcularPrimeiraCobranca(
      formData.data,
      Number(formData.cartaoId),
      cartoes
    );
  }, [cartoes, formData.cartaoId, formData.data, formData.tipoPagamento, formType]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-80 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-90 flex items-center justify-center p-4">
        <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-sm font-medium text-slate-500">Novo lançamento</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900">
                {formType === "entrada" ? "Nova entrada" : "Nova despesa"}
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

          <form onSubmit={onSave} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">Tipo</label>
                    <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setFormType("entrada")}
                        className={
                          formType === "entrada"
                            ? "flex-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm"
                            : "flex-1 rounded-lg px-4 py-2 text-sm font-medium text-slate-600"
                        }
                      >
                        Entrada
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormType("despesa")}
                        className={
                          formType === "despesa"
                            ? "flex-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm"
                            : "flex-1 rounded-lg px-4 py-2 text-sm font-medium text-slate-600"
                        }
                      >
                        Despesa
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Descrição</label>
                    <input
                      type="text"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, descricao: e.target.value }))
                      }
                      className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-700">Valor</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.valor}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, valor: e.target.value }))
                        }
                        className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-700">Data</label>
                      <input
                        type="date"
                        value={formData.data}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, data: e.target.value }))
                        }
                        className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Categoria</label>
                    <select
                      value={formData.categoria}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, categoria: e.target.value }))
                      }
                      className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                    >
                      <option value="">Selecione</option>
                      {categoriasAtuais.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formType === "despesa" && (
                  <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
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
                            cartaoId: e.target.value === "credito" ? prev.cartaoId : "",
                            parcelas: e.target.value === "credito" ? prev.parcelas : "1",
                            primeiraCobranca:
                              e.target.value === "credito" ? prev.primeiraCobranca : "",
                          }))
                        }
                        className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                      >
                        <option value="pix_dinheiro">PIX / Dinheiro</option>
                        <option value="debito">Cartão de Débito</option>
                        <option value="credito">Cartão de Crédito</option>
                      </select>
                    </div>

                    {formData.tipoPagamento === "credito" && (
                      <>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">Cartão</label>
                          <select
                            value={formData.cartaoId}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, cartaoId: e.target.value }))
                            }
                            className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                          >
                            <option value="">Selecione</option>
                            {cartoes.map((cartao) => (
                              <option key={cartao.id} value={cartao.id}>
                                {cartao.nome}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">Parcelas</label>
                            <input
                              type="number"
                              min="1"
                              value={formData.parcelas}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, parcelas: e.target.value }))
                              }
                              className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                            />
                          </div>

                          <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">
                              Primeira cobrança
                            </label>
                            <input
                              type="month"
                              value={formData.primeiraCobranca || primeiraCobrancaSugerida}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  primeiraCobranca: e.target.value,
                                }))
                              }
                              className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
