"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, Save, X } from "lucide-react";
import {
  criarLancamentosRendaVariavel,
  type LancamentoInput,
} from "../_lib/actions";
import {
  distributeAmount,
  getDatesInRange,
  getHoje,
} from "../_lib/utils";

type Perfil = {
  id: string;
  nome: string;
};

type TipoLancamento = "unico" | "intervalo";
type ModoIntervalo = "resumo" | "dia-a-dia";

export function ModalReceita({
  perfis,
  onClose,
}: {
  perfis: Perfil[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState("");

  const [tipoLancamento, setTipoLancamento] = useState<TipoLancamento>("unico");
  const [modoIntervalo, setModoIntervalo] = useState<ModoIntervalo>("resumo");

  const [data, setData] = useState(getHoje());
  const [dataInicio, setDataInicio] = useState(getHoje());
  const [dataFim, setDataFim] = useState(getHoje());

  const [descricao, setDescricao] = useState("");
  const [perfilId, setPerfilId] = useState(perfis[0]?.id ?? "");
  const [cliente, setCliente] = useState("");
  const [valorRecebido, setValorRecebido] = useState("");
  const [horas, setHoras] = useState("");
  const [quantidade, setQuantidade] = useState("");

  const datasIntervalo = useMemo(() => {
    if (tipoLancamento !== "intervalo") return [];
    return getDatesInRange(dataInicio, dataFim);
  }, [tipoLancamento, dataInicio, dataFim]);

  async function handleSalvar() {
    try {
      setErro("");

      const perfilSelecionado =
        perfis.find((perfil) => perfil.id === perfilId)?.nome ?? "";

      if (!descricao.trim()) {
        throw new Error("Informe a descrição.");
      }

      const valorNumero = Number(valorRecebido) || 0;
      const horasNumero = Number(horas) || 0;
      const quantidadeNumero = Number(quantidade) || 0;

      if (tipoLancamento === "unico") {
        if (valorNumero <= 0) {
          throw new Error("Informe um valor recebido maior que zero.");
        }

        const input: LancamentoInput = {
          data,
          descricao,
          tipoRv: "receita_bruta",
          perfil: perfilSelecionado,
          cliente,
          valorRecebido: valorNumero,
          horasTrabalhadas: horasNumero,
          quantidade: quantidadeNumero,
          custoManualDescricao: "",
          custoManualValor: 0,
          custoInsumos: 0,
          custoTotal: 0,
          lucroLiquido: valorNumero,
          lucroPorHora: horasNumero > 0 ? valorNumero / horasNumero : 0,
          margem: 100,
          itens: [],
          custosDetalhados: [],
        };

        await criarLancamentosRendaVariavel([input]);
      } else {
        if (datasIntervalo.length === 0) {
          throw new Error("O intervalo informado é inválido.");
        }

        if (valorNumero <= 0) {
          throw new Error("Informe um valor total recebido maior que zero.");
        }

        const recebidoPorDia = distributeAmount(valorNumero, datasIntervalo.length);
        const horasPorDia = distributeAmount(horasNumero, datasIntervalo.length);
        const quantidadePorDia = distributeAmount(
          quantidadeNumero,
          datasIntervalo.length
        );

        const lancamentos: LancamentoInput[] = datasIntervalo.map((d, index) => {
          const recebidoDia = recebidoPorDia[index] ?? 0;
          const horasDia = horasPorDia[index] ?? 0;
          return {
            data: d,
            descricao,
            tipoRv: "receita_bruta",
            perfil: perfilSelecionado,
            cliente,
            valorRecebido: recebidoDia,
            horasTrabalhadas: horasDia,
            quantidade: quantidadePorDia[index] ?? 0,
            custoManualDescricao: "",
            custoManualValor: 0,
            custoInsumos: 0,
            custoTotal: 0,
            lucroLiquido: recebidoDia,
            lucroPorHora: horasDia > 0 ? recebidoDia / horasDia : 0,
            margem: 100,
            itens: [],
            custosDetalhados: [],
          };
        });

        await criarLancamentosRendaVariavel(lancamentos);
      }

      router.refresh();
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao salvar receita.");
    }
  }

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
              <h2 className="text-xl font-semibold text-zinc-900">Nova receita</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Registre uma receita por dia único ou por intervalo.
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
                {datasIntervalo.length} dia(s) — valores serão rateados em modo
                resumo
                <div className="mt-2">
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input
                      type="radio"
                      name="modo"
                      checked={modoIntervalo === "resumo"}
                      onChange={() => setModoIntervalo("resumo")}
                    />
                    Resumo (rateia entre os dias)
                  </label>
                </div>
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Descrição
              </label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex.: Atendimento iFood"
                className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Perfil
                </label>
                <select
                  value={perfilId}
                  onChange={(e) => setPerfilId(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
                >
                  <option value="">Sem perfil</option>
                  {perfis.map((perfil) => (
                    <option key={perfil.id} value={perfil.id}>
                      {perfil.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Cliente (opcional)
                </label>
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Ex.: João Silva"
                  className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Valor recebido (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valorRecebido}
                onChange={(e) => setValorRecebido(e.target.value)}
                placeholder="0,00"
                className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Horas trabalhadas
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={horas}
                  onChange={(e) => setHoras(e.target.value)}
                  placeholder="0"
                  className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Quantidade
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="0"
                  className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
                />
              </div>
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
              {isPending ? "Salvando..." : "Salvar receita"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
