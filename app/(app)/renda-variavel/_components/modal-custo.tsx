"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, Save, X } from "lucide-react";
import {
  criarLancamentosRendaVariavel,
  type LancamentoInput,
} from "../_lib/actions";
import {
  getDatesInRange,
  getHoje,
} from "../_lib/utils";
import type { TipoRvLancamento } from "../_lib/tipos";
import { createClient } from "@/lib/supabase/client";

type TipoLancamento = "unico" | "intervalo";
type TipoCusto = Extract<TipoRvLancamento, "taxa_financeira" | "despesa_operacional">;

type Categoria = { id: string; nome: string; valor_padrao: number | null; usar_valor_padrao: boolean };
type Insumo = { id: string; nome: string; valor_base: number };

export function ModalCusto({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState("");

  const [tipoLancamento, setTipoLancamento] = useState<TipoLancamento>("unico");
  const [tipoCusto, setTipoCusto] = useState<TipoCusto>("despesa_operacional");

  const [data, setData] = useState(getHoje());
  const [dataInicio, setDataInicio] = useState(getHoje());
  const [dataFim, setDataFim] = useState(getHoje());

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [insumoId, setInsumoId] = useState("");

  const carregarDados = useCallback(async () => {
    const supabase = createClient();
    const [{ data: cats }, { data: ins }] = await Promise.all([
      supabase
        .from("rv_categorias_custo")
        .select("id, nome, valor_padrao, usar_valor_padrao")
        .eq("ativo", true)
        .order("nome"),
      supabase
        .from("rv_insumos")
        .select("id, nome, valor_base")
        .eq("ativo", true)
        .order("nome"),
    ]);
    setCategorias((cats ?? []) as Categoria[]);
    setInsumos((ins ?? []) as Insumo[]);
  }, []);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const datasIntervalo = useMemo(() => {
    if (tipoLancamento !== "intervalo") return [];
    return getDatesInRange(dataInicio, dataFim);
  }, [tipoLancamento, dataInicio, dataFim]);

  function handleCategoriaChange(id: string) {
    setCategoriaId(id);
    const cat = categorias.find((c) => c.id === id);
    if (cat?.usar_valor_padrao && cat.valor_padrao != null) {
      setValor(String(cat.valor_padrao));
    }
  }

  function handleInsumoChange(id: string) {
    setInsumoId(id);
    const insumo = insumos.find((i) => i.id === id);
    if (insumo && insumo.valor_base > 0) {
      setValor(String(insumo.valor_base));
      if (!descricao.trim()) {
        setDescricao(insumo.nome);
      }
    }
  }

  async function handleSalvar() {
    try {
      setErro("");

      if (!descricao.trim()) {
        throw new Error("Informe a descrição.");
      }

      const valorNumero = Number(valor) || 0;

      if (valorNumero <= 0) {
        throw new Error("Informe um valor maior que zero.");
      }

      const categoriaNome = categorias.find((c) => c.id === categoriaId)?.nome ?? "";

      const custoDetalhado: { categoriaId: string | null; categoriaNome: string; descricao: string; valor: number }[] =
        categoriaId
          ? [{ categoriaId, categoriaNome, descricao: descricao.trim(), valor: valorNumero }]
          : [];

      if (tipoLancamento === "unico") {
        const input: LancamentoInput = {
          data,
          descricao,
          tipoRv: tipoCusto,
          perfil: "",
          cliente: "",
          valorRecebido: valorNumero,
          horasTrabalhadas: 0,
          quantidade: 0,
          custoManualDescricao: "",
          custoManualValor: 0,
          custoInsumos: 0,
          custoTotal: valorNumero,
          lucroLiquido: -valorNumero,
          lucroPorHora: 0,
          margem: 0,
          itens: [],
          custosDetalhados: custoDetalhado,
        };

        await criarLancamentosRendaVariavel([input]);
      } else {
        if (datasIntervalo.length === 0) {
          throw new Error("O intervalo informado é inválido.");
        }

        // In interval mode, valor is PER DAY
        const valorPorDia = valorNumero;

        const lancamentos: LancamentoInput[] = datasIntervalo.map((d) => ({
          data: d,
          descricao,
          tipoRv: tipoCusto,
          perfil: "",
          cliente: "",
          valorRecebido: valorPorDia,
          horasTrabalhadas: 0,
          quantidade: 0,
          custoManualDescricao: "",
          custoManualValor: 0,
          custoInsumos: 0,
          custoTotal: valorPorDia,
          lucroLiquido: -valorPorDia,
          lucroPorHora: 0,
          margem: 0,
          itens: [],
          custosDetalhados: categoriaId
            ? [{ categoriaId, categoriaNome, descricao: descricao.trim(), valor: valorPorDia }]
            : [],
        }));

        await criarLancamentosRendaVariavel(lancamentos);
      }

      router.refresh();
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao salvar custo.");
    }
  }

  const valorNumerico = Number(valor) || 0;
  const totalIntervalo = tipoLancamento === "intervalo" && datasIntervalo.length > 0
    ? valorNumerico * datasIntervalo.length
    : 0;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-zinc-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">Novo custo</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Registre uma despesa operacional ou taxa financeira.
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
                Tipo de lançamento
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-100 p-1">
                <button
                  type="button"
                  onClick={() => setTipoLancamento("unico")}
                  className={
                    tipoLancamento === "unico"
                      ? "rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-sm"
                      : "rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                  }
                >
                  Dia único
                </button>
                <button
                  type="button"
                  onClick={() => setTipoLancamento("intervalo")}
                  className={
                    tipoLancamento === "intervalo"
                      ? "rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-sm"
                      : "rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                  }
                >
                  Intervalo de dias
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Tipo de custo
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-100 p-1">
                <button
                  type="button"
                  onClick={() => setTipoCusto("despesa_operacional")}
                  className={
                    tipoCusto === "despesa_operacional"
                      ? "rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-sm"
                      : "rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                  }
                >
                  Despesa operacional
                </button>
                <button
                  type="button"
                  onClick={() => setTipoCusto("taxa_financeira")}
                  className={
                    tipoCusto === "taxa_financeira"
                      ? "rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-sm"
                      : "rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                  }
                >
                  Taxa financeira
                </button>
              </div>
            </div>

            {tipoLancamento === "unico" ? (
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
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Data inicial
                  </label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Data final
                  </label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
                  />
                </div>
              </div>
            )}

            {tipoLancamento === "intervalo" && datasIntervalo.length > 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
                <CalendarRange className="mr-1 inline h-3.5 w-3.5" />
                {datasIntervalo.length} dia(s)
                {totalIntervalo > 0 && (
                  <> — total: R$ {totalIntervalo.toFixed(2)}</>
                )}
              </div>
            ) : null}

            {categorias.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Categoria{" "}
                  <span className="font-normal text-zinc-400">(opcional)</span>
                </label>
                <select
                  value={categoriaId}
                  onChange={(e) => handleCategoriaChange(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
                >
                  <option value="">Nenhuma</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {insumos.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Insumo{" "}
                  <span className="font-normal text-zinc-400">(opcional)</span>
                </label>
                <select
                  value={insumoId}
                  onChange={(e) => handleInsumoChange(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
                >
                  <option value="">Nenhum</option>
                  {insumos.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.nome} (R$ {ins.valor_base.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Descrição
              </label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex.: Combustível, Tarifa do iFood"
                className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                {tipoLancamento === "intervalo" ? "Valor por dia (R$)" : "Valor (R$)"}
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
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isPending ? "Salvando..." : "Salvar custo"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
