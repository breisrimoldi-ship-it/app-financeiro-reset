"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Wallet, X } from "lucide-react";
import {
  criarLancamentosRendaVariavel,
  type LancamentoInput,
} from "../_lib/actions";
import { getHoje } from "../_lib/utils";

type Conta = {
  id: string;
  nome: string;
};

export function ModalAporte({
  contas,
  onClose,
}: {
  contas: Conta[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState("");

  const [data, setData] = useState(getHoje());
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [contaId, setContaId] = useState(contas[0]?.id ?? "");

  async function handleSalvar() {
    try {
      setErro("");

      if (!descricao.trim()) {
        throw new Error("Informe a descrição.");
      }

      if (!contaId) {
        throw new Error("Selecione uma conta de origem.");
      }

      const valorNumero = Number(valor) || 0;

      if (valorNumero <= 0) {
        throw new Error("Informe um valor maior que zero.");
      }

      const input: LancamentoInput = {
        data,
        descricao,
        tipoRv: "aporte_cpf_para_pj",
        perfil: "",
        cliente: "",
        valorRecebido: valorNumero,
        horasTrabalhadas: 0,
        quantidade: 0,
        custoManualDescricao: "",
        custoManualValor: 0,
        custoInsumos: 0,
        custoTotal: 0,
        lucroLiquido: valorNumero,
        lucroPorHora: 0,
        margem: 0,
        origemContaId: contaId,
        itens: [],
        custosDetalhados: [],
      };

      await criarLancamentosRendaVariavel([input]);

      router.refresh();
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao salvar aporte.");
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-zinc-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">Novo aporte</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Registre uma injeção de capital de uma conta CPF para o PJ.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 p-2 text-zinc-600 transition hover:bg-zinc-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Data
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Descrição
              </label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex.: Aporte mensal"
                className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Conta de origem
              </label>
              {contas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
                  <p className="font-medium text-zinc-900">
                    Você ainda não tem contas cadastradas.
                  </p>
                  <p className="mt-1">
                    <Link
                      href="/renda-variavel/contas"
                      className="inline-flex items-center gap-1 text-zinc-900 underline"
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      Cadastrar conta
                    </Link>
                  </p>
                </div>
              ) : (
                <select
                  value={contaId}
                  onChange={(e) => setContaId(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
                >
                  {contas.map((conta) => (
                    <option key={conta.id} value={conta.id}>
                      {conta.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {erro ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => startTransition(handleSalvar)}
              disabled={isPending || contas.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isPending ? "Salvando..." : "Salvar aporte"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
