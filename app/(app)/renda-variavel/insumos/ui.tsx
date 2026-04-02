"use client";

import { useMemo, useState, useTransition } from "react";
import { Package, Plus, Save, Trash2 } from "lucide-react";
import { excluirInsumo, salvarInsumo } from "./actions";

type Categoria = {
  id: string;
  nome: string;
  ativo: boolean;
};

type Insumo = {
  id: string;
  nome: string;
  unidade: string;
  valor_base: number | null;
  categoria_id: string | null;
  ativo: boolean | null;
  tipo_valor: string | null;
  perfil_id: string | null;
};

type Props = {
  categorias: Categoria[];
  insumos: Insumo[];
};

type FormInsumo = {
  nome: string;
  categoriaId: string;
  unidade: string;
  valorBase: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function emptyForm(): FormInsumo {
  return {
    nome: "",
    categoriaId: "",
    unidade: "",
    valorBase: "",
  };
}

export default function InsumosClient({ categorias, insumos }: Props) {
  const [isPending, startTransition] = useTransition();

  const [erro, setErro] = useState("");
  const [novo, setNovo] = useState<FormInsumo>(emptyForm());

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edicao, setEdicao] = useState<Record<string, FormInsumo>>({});

  const categoriasMap = useMemo(() => {
    return new Map(categorias.map((categoria) => [categoria.id, categoria.nome]));
  }, [categorias]);

  function iniciarEdicao(insumo: Insumo) {
    setEditandoId(insumo.id);
    setEdicao((prev) => ({
      ...prev,
      [insumo.id]: {
        nome: insumo.nome ?? "",
        categoriaId: insumo.categoria_id ?? "",
        unidade: insumo.unidade ?? "",
        valorBase:
          insumo.valor_base != null ? String(Number(insumo.valor_base)) : "",
      },
    }));
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setErro("");
  }

  function atualizarNovo(campo: keyof FormInsumo, valor: string) {
    setNovo((prev) => ({ ...prev, [campo]: valor }));
  }

  function atualizarEdicao(id: string, campo: keyof FormInsumo, valor: string) {
    setEdicao((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [campo]: valor,
      },
    }));
  }

  function handleCriar() {
    startTransition(async () => {
      try {
        setErro("");

        await salvarInsumo({
          nome: novo.nome,
          categoriaId: novo.categoriaId,
          unidade: novo.unidade,
          valorBase: Number(novo.valorBase) || 0,
        });

        setNovo(emptyForm());
      } catch (error) {
        setErro(
          error instanceof Error ? error.message : "Erro ao salvar insumo."
        );
      }
    });
  }

  function handleSalvarEdicao(id: string) {
    const dados = edicao[id];
    if (!dados) return;

    startTransition(async () => {
      try {
        setErro("");

        await salvarInsumo({
          id,
          nome: dados.nome,
          categoriaId: dados.categoriaId,
          unidade: dados.unidade,
          valorBase: Number(dados.valorBase) || 0,
        });

        setEditandoId(null);
      } catch (error) {
        setErro(
          error instanceof Error ? error.message : "Erro ao atualizar insumo."
        );
      }
    });
  }

  function handleExcluir(id: string) {
    const confirmou = window.confirm(
      "Tem certeza que deseja excluir este insumo?"
    );

    if (!confirmou) return;

    startTransition(async () => {
      try {
        setErro("");
        await excluirInsumo(id);
      } catch (error) {
        setErro(
          error instanceof Error ? error.message : "Erro ao excluir insumo."
        );
      }
    });
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
              <Package className="h-4 w-4" />
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Insumos
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Cadastre custos base vinculados às categorias reais da renda
                variável.
              </p>
            </div>
          </div>

          {erro ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-zinc-900">Novo insumo</h2>
            <p className="text-sm text-zinc-500">
              Esses itens poderão ser usados nos lançamentos da renda variável.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1.1fr_1fr_0.8fr_0.8fr_auto]">
            <input
              type="text"
              value={novo.nome}
              onChange={(e) => atualizarNovo("nome", e.target.value)}
              placeholder="Nome"
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
            />

            <select
              value={novo.categoriaId}
              onChange={(e) => atualizarNovo("categoriaId", e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
            >
              <option value="">Categoria</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={novo.unidade}
              onChange={(e) => atualizarNovo("unidade", e.target.value)}
              placeholder="Unidade"
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              value={novo.valorBase}
              onChange={(e) => atualizarNovo("valorBase", e.target.value)}
              placeholder="Valor base"
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
            />

            <button
              type="button"
              onClick={handleCriar}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-zinc-900">
              Insumos cadastrados
            </h2>
            <p className="text-sm text-zinc-500">
              Todos já vinculados às categorias centrais do sistema.
            </p>
          </div>

          {insumos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
              <p className="text-sm font-medium text-zinc-900">
                Você ainda não tem insumos cadastrados.
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Cadastre itens como gasolina, pedágio, taxa Uber, farinha ou
                embalagens.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {insumos.map((insumo) => {
                const emEdicao = editandoId === insumo.id;
                const dados = edicao[insumo.id];

                return (
                  <div
                    key={insumo.id}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                  >
                    {emEdicao && dados ? (
                      <div className="grid gap-3 md:grid-cols-[1.1fr_1fr_0.8fr_0.8fr_auto_auto]">
                        <input
                          type="text"
                          value={dados.nome}
                          onChange={(e) =>
                            atualizarEdicao(insumo.id, "nome", e.target.value)
                          }
                          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                        />

                        <select
                          value={dados.categoriaId}
                          onChange={(e) =>
                            atualizarEdicao(
                              insumo.id,
                              "categoriaId",
                              e.target.value
                            )
                          }
                          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                        >
                          <option value="">Categoria</option>
                          {categorias.map((categoria) => (
                            <option key={categoria.id} value={categoria.id}>
                              {categoria.nome}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          value={dados.unidade}
                          onChange={(e) =>
                            atualizarEdicao(insumo.id, "unidade", e.target.value)
                          }
                          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                        />

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={dados.valorBase}
                          onChange={(e) =>
                            atualizarEdicao(
                              insumo.id,
                              "valorBase",
                              e.target.value
                            )
                          }
                          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                        />

                        <button
                          type="button"
                          onClick={() => handleSalvarEdicao(insumo.id)}
                          disabled={isPending}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Save className="h-4 w-4" />
                          Salvar
                        </button>

                        <button
                          type="button"
                          onClick={cancelarEdicao}
                          className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-[1.1fr_1fr_0.8fr_0.8fr_auto] md:items-center">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">
                            {insumo.nome}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Categoria:{" "}
                            {insumo.categoria_id
                              ? categoriasMap.get(insumo.categoria_id) ?? "—"
                              : "—"}
                          </p>
                        </div>

                        <div className="text-sm text-zinc-700">
                          {insumo.categoria_id
                            ? categoriasMap.get(insumo.categoria_id) ?? "—"
                            : "—"}
                        </div>

                        <div className="text-sm text-zinc-700">
                          {insumo.unidade || "—"}
                        </div>

                        <div className="text-sm font-medium text-zinc-900">
                          {formatCurrency(Number(insumo.valor_base ?? 0))}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => iniciarEdicao(insumo)}
                            className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExcluir(insumo.id)}
                            disabled={isPending}
                            className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}