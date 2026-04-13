"use client";

import { useState } from "react";
import { ArrowRightLeft, Save, X } from "lucide-react";

type ContaBancaria = {
  id: string;
  nome: string;
  tipo: string;
};

type Props = {
  contas: ContaBancaria[];
  onClose: () => void;
  onSave: (data: {
    contaOrigemId: string;
    contaDestinoId: string;
    valor: number;
    data: string;
    descricao: string;
  }) => Promise<void>;
};

export function ModalTransferencia({ contas, onClose, onSave }: Props) {
  const [contaOrigemId, setContaOrigemId] = useState("");
  const [contaDestinoId, setContaDestinoId] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  });
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  const contasDestino = contas.filter((c) => c.id !== contaOrigemId);

  async function handleSalvar() {
    setErro("");

    if (!contaOrigemId) {
      setErro("Selecione a conta de origem.");
      return;
    }
    if (!contaDestinoId) {
      setErro("Selecione a conta de destino.");
      return;
    }

    const valorNum = Number(valor);
    if (!valorNum || valorNum <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    if (!data) {
      setErro("Informe a data.");
      return;
    }

    setSaving(true);
    try {
      const contaOrigem = contas.find((c) => c.id === contaOrigemId);
      const contaDestino = contas.find((c) => c.id === contaDestinoId);
      const descFinal =
        descricao.trim() ||
        `Transferência ${contaOrigem?.nome ?? ""} → ${contaDestino?.nome ?? ""}`;

      await onSave({
        contaOrigemId,
        contaDestinoId,
        valor: valorNum,
        data,
        descricao: descFinal,
      });
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao salvar transferência."
      );
      setSaving(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-zinc-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">
                Transferência entre contas
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Mova dinheiro entre suas contas. Não é contado como
                entrada/despesa.
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
            {contas.length < 2 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Você precisa de pelo menos 2 contas cadastradas para fazer
                transferências.
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Conta de origem
                  </label>
                  <select
                    value={contaOrigemId}
                    onChange={(e) => {
                      setContaOrigemId(e.target.value);
                      if (e.target.value === contaDestinoId) {
                        setContaDestinoId("");
                      }
                    }}
                    className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
                  >
                    <option value="">Selecione</option>
                    {contas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.tipo.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRightLeft className="h-5 w-5 text-zinc-400" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Conta de destino
                  </label>
                  <select
                    value={contaDestinoId}
                    onChange={(e) => setContaDestinoId(e.target.value)}
                    disabled={!contaOrigemId}
                    className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400 disabled:opacity-60"
                  >
                    <option value="">Selecione</option>
                    {contasDestino.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.tipo.toUpperCase()})
                      </option>
                    ))}
                  </select>
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
                    Descrição (opcional)
                  </label>
                  <input
                    type="text"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex.: Juntar dinheiro no Inter"
                    className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
                  />
                </div>
              </>
            )}

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
              onClick={handleSalvar}
              disabled={saving || contas.length < 2}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Transferir"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
