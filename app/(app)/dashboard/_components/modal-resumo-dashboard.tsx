"use client";

import { useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CreditCard,
  Search,
  Tag,
  TrendingUp,
  X,
} from "lucide-react";

type ModalLancamentoItem = {
  id: string;
  tipo: "entrada" | "despesa" | "fatura" | "adiantada" | "conta";
  titulo: string;
  categoria: string;
  valor: number;
  dataPrincipal: string;
  pagamentoLabel?: string;
  cartaoNome?: string;
  competencia?: string;
};

type ModalResumoDashboardProps = {
  titulo: string;
  subtitulo: string;
  itens: ModalLancamentoItem[];
  busca: string;
  setBusca: (value: string) => void;
  onClose: () => void;
};

function formatarMoedaLocal(valor: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function ItemModalDashboard({ item }: { item: ModalLancamentoItem }) {
  const isEntrada = item.tipo === "entrada";
  const isFatura = item.tipo === "fatura";
  const isAdiantada = item.tipo === "adiantada";
  const isConta = item.tipo === "conta";

  return (
    <div className="w-full rounded-[28px] border border-slate-200/80 bg-white px-5 py-5 text-left shadow-sm md:px-6">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${
            isEntrada
              ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
              : isAdiantada
              ? "bg-blue-50 text-blue-600 ring-blue-100"
              : isFatura
              ? "bg-orange-50 text-orange-600 ring-orange-100"
              : isConta
              ? "bg-violet-50 text-violet-600 ring-violet-100"
              : "bg-rose-50 text-rose-600 ring-rose-100"
          }`}
        >
          {isEntrada ? (
            <ArrowUpRight className="h-5 w-5" />
          ) : isAdiantada ? (
            <TrendingUp className="h-5 w-5" />
          ) : isFatura ? (
            <CreditCard className="h-5 w-5" />
          ) : isConta ? (
            <Calendar className="h-5 w-5" />
          ) : (
            <ArrowDownLeft className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-slate-900">
                {item.titulo}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {item.dataPrincipal}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                  <Tag className="h-3.5 w-3.5" />
                  {item.categoria}
                </span>

                {item.pagamentoLabel ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                    {item.pagamentoLabel}
                  </span>
                ) : null}

                {item.competencia ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                    {item.competencia}
                  </span>
                ) : null}
              </div>

              {item.cartaoNome ? (
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    {item.cartaoNome}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="text-left sm:text-right">
              <p
                className={`text-xl font-semibold tracking-tight ${
                  isEntrada
                    ? "text-emerald-600"
                    : isAdiantada
                    ? "text-blue-600"
                    : isFatura
                    ? "text-orange-600"
                    : isConta
                    ? "text-violet-600"
                    : "text-rose-600"
                }`}
              >
                {isEntrada ? "+ " : "- "}
                {formatarMoedaLocal(item.valor)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ModalResumoDashboard({
  titulo,
  subtitulo,
  itens,
  busca,
  setBusca,
  onClose,
}: ModalResumoDashboardProps) {
  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return itens;

    return itens.filter((item) => {
      return (
        item.titulo.toLowerCase().includes(termo) ||
        item.categoria.toLowerCase().includes(termo) ||
        (item.cartaoNome ?? "").toLowerCase().includes(termo) ||
        (item.pagamentoLabel ?? "").toLowerCase().includes(termo) ||
        (item.competencia ?? "").toLowerCase().includes(termo)
      );
    });
  }, [busca, itens]);

  return (
    <>
      <div
        className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
        <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-sm font-medium text-slate-500">Resumo detalhado</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900">{titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitulo}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="border-b border-slate-200 px-6 py-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por título, categoria, cartão ou competência..."
                className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50/60 px-6 py-6">
            {itensFiltrados.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <p className="text-sm font-medium text-slate-900">
                  Nenhum lançamento encontrado
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Tente ajustar a busca ou revise os lançamentos do período.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {itensFiltrados.map((item) => (
                  <ItemModalDashboard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}