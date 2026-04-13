"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDownToLine, CalendarRange, Plus, Sparkles } from "lucide-react";
import { ModalReceita } from "./modal-receita";
import { ModalCusto } from "./modal-custo";
import { ModalAporte } from "./modal-aporte";

type Perfil = {
  id: string;
  nome: string;
};

type Conta = {
  id: string;
  nome: string;
};

type ModalAtivo = "receita" | "custo" | "aporte" | null;

export function HeaderActions({
  mesSelecionado,
  perfis,
  contas,
}: {
  mesSelecionado: string;
  perfis: Perfil[];
  contas: Conta[];
}) {
  const router = useRouter();
  const [modalAtivo, setModalAtivo] = useState<ModalAtivo>(null);
  const [mesInput, setMesInput] = useState(mesSelecionado);

  function handleVerMes(e: React.FormEvent) {
    e.preventDefault();
    if (!mesInput) return;
    router.push(`/renda-variavel?mes=${mesInput}`);
  }

  return (
    <>
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              Módulo de renda variável
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
                Renda variável
              </h1>
              <p className="max-w-2xl text-sm text-zinc-600 md:text-base">
                Acompanhe quanto você recebeu, quanto custou para produzir e
                quanto realmente sobrou para guardar, transferir ou investir.
              </p>
            </div>

            <form onSubmit={handleVerMes} className="mt-3 flex items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-500">
                <CalendarRange className="h-4 w-4" />
              </div>
              <input
                type="month"
                value={mesInput}
                onChange={(e) => setMesInput(e.target.value)}
                className="h-11 rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
              />
              <button
                type="submit"
                className="h-11 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                Ver
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setModalAtivo("receita")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
              Receita
            </button>

            <button
              type="button"
              onClick={() => setModalAtivo("custo")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              <Plus className="h-4 w-4" />
              Custo
            </button>

            <button
              type="button"
              onClick={() => setModalAtivo("aporte")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Aporte
            </button>
          </div>
        </div>
      </section>

      {modalAtivo === "receita" ? (
        <ModalReceita perfis={perfis} onClose={() => setModalAtivo(null)} />
      ) : null}

      {modalAtivo === "custo" ? (
        <ModalCusto onClose={() => setModalAtivo(null)} />
      ) : null}

      {modalAtivo === "aporte" ? (
        <ModalAporte contas={contas} onClose={() => setModalAtivo(null)} />
      ) : null}
    </>
  );
}
