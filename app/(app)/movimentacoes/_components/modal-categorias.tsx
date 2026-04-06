"use client";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import type { CategoryManagerTab, CategoryOption } from "../_lib/types";

export function ModalCategorias({
  categoriaTab,
  setCategoriaTab,
  categoriasGerenciadasAtuais,
  loadingCategorias,
  novaCategoriaNome,
  setNovaCategoriaNome,
  editingCategoriaId,
  editingCategoriaNome,
  setEditingCategoriaNome,
  onClose,
  onAddCategoria,
  onStartEditCategoria,
  onCancelEditCategoria,
  onSaveCategoriaEdit,
  onDeleteCategoria,
}: {
  categoriaTab: CategoryManagerTab;
  setCategoriaTab: (tab: CategoryManagerTab) => void;
  categoriasGerenciadasAtuais: CategoryOption[];
  loadingCategorias: boolean;
  novaCategoriaNome: string;
  setNovaCategoriaNome: (v: string) => void;
  editingCategoriaId: string | null;
  editingCategoriaNome: string;
  setEditingCategoriaNome: (v: string) => void;
  onClose: () => void;
  onAddCategoria: () => void;
  onStartEditCategoria: (c: CategoryOption) => void;
  onCancelEditCategoria: () => void;
  onSaveCategoriaEdit: () => void;
  onDeleteCategoria: (c: CategoryOption) => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
        <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Gerenciar categorias
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900">
                Categorias de movimentações
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

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              <div className="inline-flex w-fit rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setCategoriaTab("entrada");
                    onCancelEditCategoria();
                  }}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    categoriaTab === "entrada"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Entradas
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCategoriaTab("despesa");
                    onCancelEditCategoria();
                  }}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    categoriaTab === "despesa"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Despesas
                </button>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
                <h4 className="text-sm font-semibold text-slate-900">
                  Nova categoria
                </h4>
                {loadingCategorias ? (
                  <p className="mt-2 text-sm text-slate-500">Carregando categorias...</p>
                ) : null}
                <p className="mt-1 text-sm text-slate-500">
                  As categorias desta tela ficam salvas no Supabase e vinculadas ao seu usuário.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={novaCategoriaNome}
                    onChange={(e) => setNovaCategoriaNome(e.target.value)}
                    placeholder={`Nome da categoria de ${categoriaTab === "entrada" ? "entrada" : "despesa"}`}
                    className="h-12 flex-1 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                  />

                  <button
                    type="button"
                    onClick={onAddCategoria}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:opacity-95"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {categoriasGerenciadasAtuais.map((categoria) => {
                  const emEdicao = editingCategoriaId === categoria.id;

                  return (
                    <div
                      key={categoria.id}
                      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      {emEdicao ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editingCategoriaNome}
                            onChange={(e) => setEditingCategoriaNome(e.target.value)}
                            className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                          />

                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={onCancelEditCategoria}
                              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              Cancelar
                            </button>

                            <button
                              type="button"
                              onClick={onSaveCategoriaEdit}
                              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-95"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {categoria.label}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Categoria sincronizada com o Supabase
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => onStartEditCategoria(categoria)}
                              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteCategoria(categoria)}
                              className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
