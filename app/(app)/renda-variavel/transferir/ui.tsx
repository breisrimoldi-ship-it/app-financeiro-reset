"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRightLeft, Save, Wallet } from "lucide-react";
import { transferirSaldoRendaVariavel } from "./actions";

type TransferenciaRow = {
  id: string;
  competencia: string;
  data_transferencia: string;
  valor: number | string;
  destino: string;
  descricao: string | null;
  created_at: string;
};

type Props = {
  competenciaAtual: string;
  competenciaLabel: string;
  lucroMes: number;
  transferidoMes: number;
  disponivel: number;
  historico: TransferenciaRow[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatDate(value: string) {
  const [ano, mes, dia] = value.split("-");
  if (!ano || !mes || !dia) return value;
  return `${dia}/${mes}/${ano}`;
}

export default function TransferirClient({
  competenciaAtual,
  competenciaLabel,
  lucroMes,
  transferidoMes,
  disponivel,
  historico,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const [dataTransferencia, setDataTransferencia] = useState(getHoje());
  const [valor, setValor] = useState(disponivel > 0 ? String(disponivel) : "");
  const [descricao, setDescricao] = useState(
    `Transferência da renda variável (${competenciaAtual})`
  );
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const historicoTotal = useMemo(
    () => historico.reduce((acc, item) => acc + Number(item.valor ?? 0), 0),
    [historico]
  );

  function handleTransferir() {
    startTransition(async () => {
      try {
        setErro("");
        setSucesso("");

        await transferirSaldoRendaVariavel({
          competencia: competenciaAtual,
          dataTransferencia,
          valor: Number(valor),
          descricao,
        });

        setSucesso("Transferência realizada com sucesso.");
      } catch (error) {
        setErro(
          error instanceof Error ? error.message : "Erro ao transferir saldo."
        );
      }
    });
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Link
                href="/renda-variavel"
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para renda variável
              </Link>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
                  Transferir saldo
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Mova o saldo da renda variável para o financeiro geral e zere a
                  carteira desta competência.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTransferir}
              disabled={isPending || disponivel <= 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isPending ? "Transferindo..." : "Transferir agora"}
            </button>
          </div>

          {erro ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </div>
          ) : null}

          {sucesso ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {sucesso}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Lucro do mês</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">
              {formatCurrency(lucroMes)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Competência {competenciaLabel}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Já transferido</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">
              {formatCurrency(transferidoMes)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Total já enviado neste mês
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">Disponível para transferir</p>
              <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">
              {formatCurrency(disponivel)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Isso é o que será zerado da carteira do mês
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
                <ArrowRightLeft className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Nova transferência
                </h2>
                <p className="text-sm text-zinc-500">
                  O valor transferido entra como entrada no financeiro geral.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Competência
                </label>
                <input
                  type="month"
                  value={competenciaAtual}
                  disabled
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm text-zinc-700 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Data da transferência
                </label>
                <input
                  type="date"
                  value={dataTransferencia}
                  onChange={(e) => setDataTransferencia(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Valor
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Destino
                </label>
                <input
                  type="text"
                  value="Financeiro geral"
                  disabled
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm text-zinc-700 outline-none"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-zinc-700">
                  Descrição
                </label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-zinc-900">
                Histórico da competência
              </h2>
              <p className="text-sm text-zinc-500">
                Transferências já feitas em {competenciaLabel}.
              </p>
            </div>

            {historico.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center">
                <p className="text-sm font-medium text-zinc-900">
                  Nenhuma transferência registrada neste mês.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {historico.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          {item.descricao || "Transferência da renda variável"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {formatDate(item.data_transferencia)} • Financeiro geral
                        </p>
                      </div>

                      <p className="text-sm font-semibold text-zinc-900">
                        {formatCurrency(Number(item.valor ?? 0))}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-800">
                  Total transferido no mês: {formatCurrency(historicoTotal)}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}