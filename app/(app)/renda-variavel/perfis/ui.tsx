"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash2, UserRound } from "lucide-react";
import { salvarPerfil, togglePerfil, excluirPerfil } from "./actions";

type Perfil = {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
};

type Props = {
  perfis: Perfil[];
};

export default function PerfisClient({ perfis }: Props) {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edicao, setEdicao] = useState<Record<string, { nome: string; descricao: string }>>({});

  function handleCriar() {
    startTransition(async () => {
      try {
        setErro("");
        await salvarPerfil({ nome: novoNome, descricao: novaDescricao });
        setNovoNome("");
        setNovaDescricao("");
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Erro ao criar perfil.");
      }
    });
  }

  function iniciarEdicao(perfil: Perfil) {
    setEditandoId(perfil.id);
    setEdicao((prev) => ({
      ...prev,
      [perfil.id]: { nome: perfil.nome, descricao: perfil.descricao ?? "" },
    }));
  }

  function handleSalvarEdicao(id: string) {
    const dados = edicao[id];
    if (!dados) return;

    startTransition(async () => {
      try {
        setErro("");
        await salvarPerfil({ id, nome: dados.nome, descricao: dados.descricao });
        setEditandoId(null);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Erro ao atualizar perfil.");
      }
    });
  }

  function handleToggle(id: string, ativo: boolean) {
    startTransition(async () => {
      try {
        setErro("");
        await togglePerfil(id, ativo);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Erro ao alternar perfil.");
      }
    });
  }

  function handleExcluir(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir este perfil?")) return;

    startTransition(async () => {
      try {
        setErro("");
        await excluirPerfil(id);
      } catch (error) {
        setErro(error instanceof Error ? error.message : "Erro ao excluir perfil.");
      }
    });
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <Link
            href="/renda-variavel"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para renda variável
          </Link>

          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
              <UserRound className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Perfis
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Gerencie seus perfis de trabalho como motorista, confeitaria,
                freelancer ou personalizado.
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
            <h2 className="text-lg font-semibold text-zinc-900">Novo perfil</h2>
            <p className="text-sm text-zinc-500">
              Crie perfis para organizar seus lançamentos por tipo de atividade.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto]">
            <input
              type="text"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Nome do perfil"
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
            />
            <input
              type="text"
              value={novaDescricao}
              onChange={(e) => setNovaDescricao(e.target.value)}
              placeholder="Descrição (opcional)"
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
            />
            <button
              type="button"
              onClick={handleCriar}
              disabled={isPending || !novoNome.trim()}
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
              Perfis cadastrados
            </h2>
            <p className="text-sm text-zinc-500">
              Esses perfis aparecem na hora de criar lançamentos da renda variável.
            </p>
          </div>

          {perfis.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
              <p className="text-sm font-medium text-zinc-900">
                Você ainda não tem perfis cadastrados.
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Crie seu primeiro perfil para organizar suas atividades.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {perfis.map((perfil) => {
                const emEdicao = editandoId === perfil.id;
                const dados = edicao[perfil.id];

                return (
                  <div
                    key={perfil.id}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                  >
                    {emEdicao && dados ? (
                      <div className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto_auto]">
                        <input
                          type="text"
                          value={dados.nome}
                          onChange={(e) =>
                            setEdicao((prev) => ({
                              ...prev,
                              [perfil.id]: { ...prev[perfil.id], nome: e.target.value },
                            }))
                          }
                          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                        />
                        <input
                          type="text"
                          value={dados.descricao}
                          onChange={(e) =>
                            setEdicao((prev) => ({
                              ...prev,
                              [perfil.id]: { ...prev[perfil.id], descricao: e.target.value },
                            }))
                          }
                          placeholder="Descrição"
                          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleSalvarEdicao(perfil.id)}
                          disabled={isPending}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Save className="h-4 w-4" />
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditandoId(null)}
                          className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">
                            {perfil.nome}
                          </p>
                          {perfil.descricao ? (
                            <p className="mt-1 text-xs text-zinc-500">
                              {perfil.descricao}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => iniciarEdicao(perfil)}
                            className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggle(perfil.id, !perfil.ativo)}
                            disabled={isPending}
                            className={`rounded-2xl px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              perfil.ativo
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                            }`}
                          >
                            {perfil.ativo ? "Ativo" : "Inativo"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExcluir(perfil.id)}
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
