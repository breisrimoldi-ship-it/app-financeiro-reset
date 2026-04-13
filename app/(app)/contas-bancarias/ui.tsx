"use client";

import { useState, useTransition } from "react";
import { Landmark, Plus, Save, Trash2 } from "lucide-react";
import {
  salvarContaBancaria,
  toggleContaBancaria,
  excluirContaBancaria,
} from "./actions";

type ContaBancaria = {
  id: string;
  nome: string;
  tipo: string;
  saldo_inicial: number;
  ativo: boolean;
  created_at: string;
};

type Props = {
  contas: ContaBancaria[];
  precisaMigracao?: boolean;
};

export default function ContasBancariasClient({
  contas,
  precisaMigracao,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState("");

  const [novoNome, setNovoNome] = useState("");
  const [novoTipo, setNovoTipo] = useState<"cpf" | "pj">("cpf");
  const [novoSaldo, setNovoSaldo] = useState("");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edicao, setEdicao] = useState<
    Record<string, { nome: string; tipo: "cpf" | "pj"; saldoInicial: string }>
  >({});

  const contasCpf = contas.filter((c) => c.tipo === "cpf");
  const contasPj = contas.filter((c) => c.tipo === "pj");

  function handleCriar() {
    startTransition(async () => {
      try {
        setErro("");
        await salvarContaBancaria({
          nome: novoNome,
          tipo: novoTipo,
          saldoInicial: Number(novoSaldo) || 0,
        });
        setNovoNome("");
        setNovoSaldo("");
      } catch (error) {
        setErro(
          error instanceof Error ? error.message : "Erro ao criar conta."
        );
      }
    });
  }

  function iniciarEdicao(conta: ContaBancaria) {
    setEditandoId(conta.id);
    setEdicao((prev) => ({
      ...prev,
      [conta.id]: {
        nome: conta.nome,
        tipo: conta.tipo as "cpf" | "pj",
        saldoInicial: String(conta.saldo_inicial),
      },
    }));
  }

  function handleSalvarEdicao(id: string) {
    const dados = edicao[id];
    if (!dados) return;

    startTransition(async () => {
      try {
        setErro("");
        await salvarContaBancaria({
          id,
          nome: dados.nome,
          tipo: dados.tipo,
          saldoInicial: Number(dados.saldoInicial) || 0,
        });
        setEditandoId(null);
      } catch (error) {
        setErro(
          error instanceof Error ? error.message : "Erro ao atualizar conta."
        );
      }
    });
  }

  function handleToggle(id: string, ativo: boolean) {
    startTransition(async () => {
      try {
        setErro("");
        await toggleContaBancaria(id, ativo);
      } catch (error) {
        setErro(
          error instanceof Error ? error.message : "Erro ao alternar conta."
        );
      }
    });
  }

  function handleExcluir(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir esta conta?")) return;

    startTransition(async () => {
      try {
        setErro("");
        await excluirContaBancaria(id);
      } catch (error) {
        setErro(
          error instanceof Error ? error.message : "Erro ao excluir conta."
        );
      }
    });
  }

  function renderConta(conta: ContaBancaria) {
    const emEdicao = editandoId === conta.id;
    const dados = edicao[conta.id];

    return (
      <div
        key={conta.id}
        className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
      >
        {emEdicao && dados ? (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <input
                type="text"
                value={dados.nome}
                onChange={(e) =>
                  setEdicao((prev) => ({
                    ...prev,
                    [conta.id]: { ...prev[conta.id], nome: e.target.value },
                  }))
                }
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
              />
              <select
                value={dados.tipo}
                onChange={(e) =>
                  setEdicao((prev) => ({
                    ...prev,
                    [conta.id]: {
                      ...prev[conta.id],
                      tipo: e.target.value as "cpf" | "pj",
                    },
                  }))
                }
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
              >
                <option value="cpf">CPF</option>
                <option value="pj">PJ</option>
              </select>
              <input
                type="number"
                step="0.01"
                value={dados.saldoInicial}
                onChange={(e) =>
                  setEdicao((prev) => ({
                    ...prev,
                    [conta.id]: {
                      ...prev[conta.id],
                      saldoInicial: e.target.value,
                    },
                  }))
                }
                placeholder="Saldo inicial"
                className="w-32 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSalvarEdicao(conta.id)}
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
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                {conta.nome}
              </p>
              {conta.saldo_inicial > 0 ? (
                <p className="text-xs text-zinc-500">
                  Saldo inicial: R$ {Number(conta.saldo_inicial).toFixed(2)}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => iniciarEdicao(conta)}
                className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={() => handleToggle(conta.id, !conta.ativo)}
                disabled={isPending}
                className={`rounded-2xl px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  conta.ativo
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {conta.ativo ? "Ativo" : "Inativo"}
              </button>

              <button
                type="button"
                onClick={() => handleExcluir(conta.id)}
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
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
              <Landmark className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Contas bancarias
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Cadastre suas contas bancarias (Nubank, Inter, C6, etc.) para
                rastrear saldos e vincular movimentacoes.
              </p>
            </div>
          </div>

          {precisaMigracao ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              A tabela <code>contas_bancarias</code> ainda nao existe no banco.
              Rode a migracao <code>sql/003_contas_bancarias.sql</code> no
              Supabase antes de cadastrar contas.
            </div>
          ) : null}

          {erro ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-zinc-900">Nova conta</h2>
            <p className="text-sm text-zinc-500">
              Adicione uma conta para rastrear saldo e vincular movimentacoes.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <input
              type="text"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Nome da conta (ex: Nubank PF)"
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
            />
            <select
              value={novoTipo}
              onChange={(e) => setNovoTipo(e.target.value as "cpf" | "pj")}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
            >
              <option value="cpf">CPF</option>
              <option value="pj">PJ</option>
            </select>
            <input
              type="number"
              step="0.01"
              value={novoSaldo}
              onChange={(e) => setNovoSaldo(e.target.value)}
              placeholder="Saldo inicial"
              className="w-36 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
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

        {contasCpf.length > 0 ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-zinc-900">
                Contas CPF
              </h2>
              <p className="text-sm text-zinc-500">
                Contas pessoa fisica vinculadas ao seu CPF.
              </p>
            </div>
            <div className="space-y-3">{contasCpf.map(renderConta)}</div>
          </section>
        ) : null}

        {contasPj.length > 0 ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-zinc-900">
                Contas PJ
              </h2>
              <p className="text-sm text-zinc-500">
                Contas vinculadas a pessoa juridica.
              </p>
            </div>
            <div className="space-y-3">{contasPj.map(renderConta)}</div>
          </section>
        ) : null}

        {contas.length === 0 && !precisaMigracao ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
              <p className="text-sm font-medium text-zinc-900">
                Voce ainda nao tem contas cadastradas.
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Adicione sua primeira conta acima.
              </p>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
