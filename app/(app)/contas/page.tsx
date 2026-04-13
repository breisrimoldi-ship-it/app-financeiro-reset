"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlarmClock,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Plus,
  Search,
  SlidersHorizontal,
  Wallet,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import type {
  TipoRecorrencia,
  AbaFiltro,
  PrazoModo,
  ContaFixa,
  PagamentoConta,
} from "./_lib/types";
import {
  cls,
  contaAtivaNoMes,
  contaExisteNoMes,
  formatarMesAno,
  formatarMoeda,
  getDataHoje,
  getMesAtual,
  getMesesRestantes,
  normalizarCategoria,
  ordenarPorVencimento,
} from "./_lib/utils";
import { ContaCard } from "./_components/conta-card";
import { ResumoCard } from "./_components/resumo-card";

export default function ContasPage() {
    const supabase = createClient();
  const [contas, setContas] = useState<ContaFixa[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoConta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<AbaFiltro>("todas");
  const [mesSelecionado, setMesSelecionado] = useState(getMesAtual());
  const [pagandoKey, setPagandoKey] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [diaVencimento, setDiaVencimento] = useState("");
  const [categoria, setCategoria] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [ativa, setAtiva] = useState(true);

  const [tipoRecorrencia, setTipoRecorrencia] =
    useState<TipoRecorrencia>("indeterminada");
  const [inicioCobranca, setInicioCobranca] = useState("");
  const [prazoModo, setPrazoModo] = useState<PrazoModo>("quantidade");
  const [quantidadeMeses, setQuantidadeMeses] = useState("");
  const [fimCobranca, setFimCobranca] = useState("");

  const carregarPagina = useCallback(async () => {
    setCarregando(true);
    setErro("");

    const [
      { data: contasData, error: contasError },
      { data: pagamentosData, error: pagamentosError },
    ] = await Promise.all([
      supabase
        .from("contas_fixas")
        .select(
          "id, descricao, valor, dia_vencimento, categoria, observacoes, ativa, user_id, tipo_recorrencia, inicio_cobranca, fim_cobranca, quantidade_meses, created_at, updated_at"
        )
        .order("dia_vencimento", { ascending: true })
        .order("descricao", { ascending: true }),

      supabase
        .from("pagamentos_contas")
        .select(
          "id, origem_tipo, origem_id, mes_referencia, valor_pago, data_pagamento, status, observacoes, user_id, created_at, updated_at"
        ),
    ]);

   if (contasError || pagamentosError) {
  alert(
    JSON.stringify(
      {
        contasError: contasError?.message,
        pagamentosError: pagamentosError?.message,
      },
      null,
      2
    )
  );

  setErro("Não foi possível carregar as contas.");
  setCarregando(false);
  return;
}

    setContas((contasData as ContaFixa[]) || []);
    setPagamentos((pagamentosData as PagamentoConta[]) || []);
    setCarregando(false);
  }, [supabase]);

useEffect(() => {
  void carregarPagina();
}, [carregarPagina]);

  function limparFormulario() {
    setDescricao("");
    setValor("");
    setDiaVencimento("");
    setCategoria("");
    setObservacoes("");
    setAtiva(true);
    setTipoRecorrencia("indeterminada");
    setInicioCobranca("");
    setPrazoModo("quantidade");
    setQuantidadeMeses("");
    setFimCobranca("");
    setEditandoId(null);
    setErro("");
  }

  function limparFiltros() {
    setBusca("");
    setFiltroCategoria("todas");
  }

  function abrirNovaConta() {
    limparFormulario();
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setErro("");
  }

  function preencherFormulario(conta: ContaFixa) {
    setDescricao(conta.descricao);
    setValor(String(conta.valor));
    setDiaVencimento(String(conta.dia_vencimento));
    setCategoria(conta.categoria || "");
    setObservacoes(conta.observacoes || "");
    setAtiva(conta.ativa);
    setTipoRecorrencia(conta.tipo_recorrencia || "indeterminada");
    setInicioCobranca(conta.inicio_cobranca || "");
    setQuantidadeMeses(
      conta.quantidade_meses ? String(conta.quantidade_meses) : ""
    );
    setFimCobranca(conta.fim_cobranca || "");
    setPrazoModo(conta.fim_cobranca ? "fim" : "quantidade");
    setEditandoId(conta.id);
    setErro("");
    setModalAberto(true);
  }

  function handleTrocaTipoRecorrencia(tipo: TipoRecorrencia) {
    setTipoRecorrencia(tipo);

    if (tipo === "indeterminada") {
      setQuantidadeMeses("");
      setFimCobranca("");
      setPrazoModo("quantidade");
    }
  }

  function handleTrocaPrazoModo(modo: PrazoModo) {
    setPrazoModo(modo);

    if (modo === "quantidade") {
      setFimCobranca("");
    } else {
      setQuantidadeMeses("");
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!descricao.trim()) {
      setErro("Informe a descrição da conta.");
      return;
    }

    if (!valor || Number(valor) <= 0) {
      setErro("Informe um valor válido.");
      return;
    }

    if (!diaVencimento || Number(diaVencimento) < 1 || Number(diaVencimento) > 31) {
      setErro("Informe um dia de vencimento entre 1 e 31.");
      return;
    }

    if (!inicioCobranca) {
      setErro("Informe o mês de início da cobrança.");
      return;
    }

    if (tipoRecorrencia === "temporaria") {
      if (
        prazoModo === "quantidade" &&
        (!quantidadeMeses || Number(quantidadeMeses) < 1)
      ) {
        setErro("Informe a quantidade de meses da conta temporária.");
        return;
      }

      if (prazoModo === "fim" && !fimCobranca) {
        setErro("Informe o mês final da conta temporária.");
        return;
      }

      if (prazoModo === "fim" && fimCobranca < inicioCobranca) {
        setErro("O mês final não pode ser menor que o mês inicial.");
        return;
      }
    }

    setSalvando(true);
    setErro("");

    const payload = {
      descricao: descricao.trim(),
      valor: Number(valor),
      dia_vencimento: Number(diaVencimento),
      categoria: normalizarCategoria(categoria) || null,
      observacoes: observacoes.trim() || null,
      ativa,
      tipo_recorrencia: tipoRecorrencia,
      inicio_cobranca: inicioCobranca || null,
      quantidade_meses:
        tipoRecorrencia === "temporaria" && prazoModo === "quantidade"
          ? Number(quantidadeMeses)
          : null,
      fim_cobranca:
        tipoRecorrencia === "temporaria" && prazoModo === "fim"
          ? fimCobranca
          : null,
    };

    if (editandoId) {
      const { error } = await supabase
        .from("contas_fixas")
        .update(payload)
        .eq("id", editandoId);

      if (error) {
        setErro(`Erro ao atualizar conta: ${error.message}`);
        setSalvando(false);
        return;
      }
    } else {
      const { error } = await supabase.from("contas_fixas").insert(payload);

      if (error) {
        setErro(`Erro ao cadastrar conta: ${error.message}`);
        setSalvando(false);
        return;
      }
    }

    await carregarPagina();
    setSalvando(false);
    fecharModal();
    limparFormulario();
  }

  async function alternarStatus(conta: ContaFixa) {
    const { error } = await supabase
      .from("contas_fixas")
      .update({ ativa: !conta.ativa })
      .eq("id", conta.id);

    if (error) {
      alert(`Erro ao alterar status: ${error.message}`);
      return;
    }

    await carregarPagina();
  }

  async function excluirConta(conta: ContaFixa) {
    const confirmou = window.confirm(
      `Deseja realmente excluir a conta "${conta.descricao}"?`
    );

    if (!confirmou) return;

    const { error } = await supabase
      .from("contas_fixas")
      .delete()
      .eq("id", conta.id);

    if (error) {
      alert(`Erro ao excluir conta: ${error.message}`);
      return;
    }

    await carregarPagina();

    if (editandoId === conta.id) {
      limparFormulario();
      fecharModal();
    }
  }

  async function pagarConta(conta: ContaFixa, mesRef: string) {
    const key = `${conta.id}-${mesRef}`;

    try {
      setPagandoKey(key);

      const pagamentoExistente = pagamentos.find(
        (item) =>
          item.origem_tipo === "fixa" &&
          item.origem_id === conta.id &&
          item.mes_referencia === mesRef
      );

      if (pagamentoExistente) {
        const { data, error } = await supabase
          .from("pagamentos_contas")
          .update({
            valor_pago: Number(conta.valor),
            data_pagamento: getDataHoje(),
            status: "paga",
          })
          .eq("id", pagamentoExistente.id)
          .select()
          .single();

        if (error) {
          alert(`Erro ao pagar conta: ${error.message}`);
          return;
        }

        setPagamentos((atual) =>
          atual.map((item) =>
            item.id === pagamentoExistente.id ? (data as PagamentoConta) : item
          )
        );
      } else {
        const { data, error } = await supabase
          .from("pagamentos_contas")
          .insert({
            origem_tipo: "fixa",
            origem_id: conta.id,
            mes_referencia: mesRef,
            valor_pago: Number(conta.valor),
            data_pagamento: getDataHoje(),
            status: "paga",
          })
          .select()
          .single();

        if (error) {
          alert(`Erro ao pagar conta: ${error.message}`);
          return;
        }

        setPagamentos((atual) => [...atual, data as PagamentoConta]);
      }
    } finally {
      setPagandoKey(null);
    }
  }

  async function desmarcarPagamentoConta(conta: ContaFixa, mesRef: string) {
    const key = `${conta.id}-${mesRef}`;

    try {
      setPagandoKey(key);

      const pagamentoExistente = pagamentos.find(
        (item) =>
          item.origem_tipo === "fixa" &&
          item.origem_id === conta.id &&
          item.mes_referencia === mesRef
      );

      if (!pagamentoExistente) {
        alert("Não foi encontrado pagamento para essa competência.");
        return;
      }

      const { data, error } = await supabase
        .from("pagamentos_contas")
        .update({
          status: "aberta",
          data_pagamento: null,
          valor_pago: 0,
        })
        .eq("id", pagamentoExistente.id)
        .select()
        .single();

      if (error) {
        alert(`Erro ao desfazer pagamento: ${error.message}`);
        return;
      }

      setPagamentos((atual) =>
        atual.map((item) =>
          item.id === pagamentoExistente.id ? (data as PagamentoConta) : item
        )
      );
    } finally {
      setPagandoKey(null);
    }
  }

  const contasOrdenadas = useMemo(() => {
    return [...contas].sort(ordenarPorVencimento);
  }, [contas]);

  const contasDoMes = useMemo(() => {
    return contasOrdenadas.filter((conta) => contaExisteNoMes(conta, mesSelecionado));
  }, [contasOrdenadas, mesSelecionado]);

  const categoriasDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        contas
          .map((item) => item.categoria?.trim())
          .filter((item): item is string => Boolean(item))
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [contas]);

  const contasFiltradasBase = useMemo(() => {
    if (abaAtiva === "ativas") {
      return contasDoMes.filter((conta) => conta.ativa);
    }

    if (abaAtiva === "inativas") {
      return contasDoMes.filter((conta) => !conta.ativa);
    }

    return contasDoMes;
  }, [abaAtiva, contasDoMes]);

  const contasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return contasFiltradasBase.filter((conta) => {
      const matchBusca =
        !termo ||
        conta.descricao.toLowerCase().includes(termo) ||
        (conta.categoria || "").toLowerCase().includes(termo) ||
        (conta.observacoes || "").toLowerCase().includes(termo);

      const matchCategoria =
        filtroCategoria === "todas" || conta.categoria === filtroCategoria;

      return matchBusca && matchCategoria;
    });
  }, [contasFiltradasBase, busca, filtroCategoria]);

  const totalContasAtivasNoMes = useMemo(() => {
    return contas.filter((conta) => contaAtivaNoMes(conta, mesSelecionado)).length;
  }, [contas, mesSelecionado]);

  const totalMensalAtivo = useMemo(() => {
    return contas
      .filter((conta) => contaAtivaNoMes(conta, mesSelecionado))
      .reduce((acc, conta) => acc + Number(conta.valor), 0);
  }, [contas, mesSelecionado]);

  const totalCadastrado = contasDoMes.length;
  const totalInativas = contasDoMes.filter((conta) => !conta.ativa).length;
  const totalAtivas = contasDoMes.filter((conta) => conta.ativa).length;

  const totalTemporariasDevido = useMemo(() => {
    return contas
      .filter((conta) => conta.tipo_recorrencia === "temporaria" && conta.ativa)
      .reduce((acc, conta) => {
        const mesesRestantes = getMesesRestantes(conta, mesSelecionado);
        return acc + Number(conta.valor) * mesesRestantes;
      }, 0);
  }, [contas, mesSelecionado]);

  const totalPagamentosAdiantadosNoMes = useMemo(() => {
    return pagamentos
      .filter((pagamento) => pagamento.status === "paga")
      .filter((pagamento) => pagamento.data_pagamento?.slice(0, 7) === mesSelecionado)
      .filter((pagamento) => pagamento.mes_referencia > mesSelecionado)
      .reduce((acc, pagamento) => acc + Number(pagamento.valor_pago), 0);
  }, [pagamentos, mesSelecionado]);

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-slate-200 bg-linear-to-br from-white to-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Contas
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Gerencie contas recorrentes, temporárias e pagamentos por competência
            </p>
          </div>

          <button
            type="button"
            onClick={abrirNovaConta}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Nova conta
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block max-w-xs">
          <span className="mb-2 block text-sm font-medium text-slate-700">Mês</span>
          <input
            id="mesSelecionado"
            type="month"
            value={mesSelecionado}
            onChange={(e) => {
              setMesSelecionado(e.target.value);
              limparFiltros();
            }}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
          />
        </label>
      </div>

      {carregando ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="h-32 animate-pulse rounded-[28px] bg-slate-200" />
          <div className="h-32 animate-pulse rounded-[28px] bg-slate-200" />
          <div className="h-32 animate-pulse rounded-[28px] bg-slate-200" />
          <div className="h-32 animate-pulse rounded-[28px] bg-slate-200" />
          <div className="h-32 animate-pulse rounded-[28px] bg-slate-200" />
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <ResumoCard
            titulo="Contas ativas no mês"
            valor={totalContasAtivasNoMes}
            descricao="Ativas dentro do mês consultado"
            icon={<CreditCard className="h-4 w-4 text-slate-700" />}
          />

          <ResumoCard
            titulo="Total mensal ativo"
            valor={formatarMoeda(totalMensalAtivo)}
            descricao={`Soma das contas ativas em ${formatarMesAno(mesSelecionado)}`}
            icon={<CircleDollarSign className="h-4 w-4 text-blue-600" />}
            destaque="blue"
          />

          <ResumoCard
            titulo="Temporárias devidas"
            valor={formatarMoeda(totalTemporariasDevido)}
            descricao={`Restante a pagar desde ${formatarMesAno(mesSelecionado)}`}
            icon={<AlarmClock className="h-4 w-4 text-amber-600" />}
            destaque="amber"
          />

          <ResumoCard
            titulo="Adiantadas no mês"
            valor={formatarMoeda(totalPagamentosAdiantadosNoMes)}
            descricao="Pagas agora para competências futuras"
            icon={<CheckCircle2 className="h-4 w-4 text-sky-600" />}
            destaque="sky"
          />

          <ResumoCard
            titulo="Total no mês"
            valor={totalCadastrado}
            descricao={`${totalInativas} inativa(s)`}
            icon={<Wallet className="h-4 w-4 text-slate-700" />}
          />
        </section>
      )}

      <div className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Contas cadastradas
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Visualize, filtre e gerencie as contas do mês selecionado
              </p>
            </div>

            <div className="inline-flex w-fit rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  limparFiltros();
                  setAbaAtiva("todas");
                }}
                className={cls(
                  "rounded-2xl px-4 py-2 text-sm font-medium transition",
                  abaAtiva === "todas"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Todas ({totalCadastrado})
              </button>

              <button
                type="button"
                onClick={() => {
                  limparFiltros();
                  setAbaAtiva("ativas");
                }}
                className={cls(
                  "rounded-2xl px-4 py-2 text-sm font-medium transition",
                  abaAtiva === "ativas"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Ativas ({totalAtivas})
              </button>

              <button
                type="button"
                onClick={() => {
                  limparFiltros();
                  setAbaAtiva("inativas");
                }}
                className={cls(
                  "rounded-2xl px-4 py-2 text-sm font-medium transition",
                  abaAtiva === "inativas"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Inativas ({totalInativas})
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5 md:p-6">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por descrição, categoria ou observação..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
                <SlidersHorizontal className="h-4 w-4" />
              </div>

              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
              >
                <option value="todas">Todas as categorias</option>
                {categoriasDisponiveis.map((categoriaItem) => (
                  <option key={categoriaItem} value={categoriaItem}>
                    {categoriaItem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="text-sm text-slate-600">
              Mostrando{" "}
              <span className="font-semibold text-slate-900">
                {contasFiltradas.length}
              </span>{" "}
              {contasFiltradas.length === 1 ? "conta" : "contas"}
            </div>

            <div className="flex flex-wrap gap-2">
              {busca ? (
                <span className="rounded-full bg-white px-3 py-1 text-sm text-slate-700">
                  Busca: {busca}
                </span>
              ) : null}

              {filtroCategoria !== "todas" ? (
                <span className="rounded-full bg-white px-3 py-1 text-sm text-slate-700">
                  Categoria: {filtroCategoria}
                </span>
              ) : null}

              {busca || filtroCategoria !== "todas" ? (
                <button
                  type="button"
                  className="rounded-full px-3 py-1 text-sm text-slate-600 transition hover:bg-white"
                  onClick={limparFiltros}
                >
                  Limpar filtros
                </button>
              ) : null}
            </div>
          </div>

          {carregando ? (
            <div className="space-y-3">
              <div className="h-40 animate-pulse rounded-[28px] bg-slate-200" />
              <div className="h-40 animate-pulse rounded-[28px] bg-slate-200" />
              <div className="h-40 animate-pulse rounded-[28px] bg-slate-200" />
            </div>
          ) : contasFiltradas.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <Wallet className="h-6 w-6 text-slate-400" />
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-800">
                Nenhuma conta encontrada
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Não encontramos contas com os filtros atuais. Tente limpar a busca
                ou selecionar outra categoria.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {contasFiltradas.map((conta) => {
                const pagamentoMes = pagamentos.find(
                  (item) =>
                    item.origem_tipo === "fixa" &&
                    item.origem_id === conta.id &&
                    item.mes_referencia === mesSelecionado &&
                    item.status === "paga"
                );

                const estaPagando = pagandoKey === `${conta.id}-${mesSelecionado}`;

                return (
                  <ContaCard
                    key={conta.id}
                    conta={conta}
                    mesSelecionado={mesSelecionado}
                    pagamentoMes={pagamentoMes}
                    estaPagando={estaPagando}
                    onEditar={() => preencherFormulario(conta)}
                    onPagar={() => pagarConta(conta, mesSelecionado)}
                    onDesfazerPagamento={() =>
                      desmarcarPagamentoConta(conta, mesSelecionado)
                    }
                    onAlternarStatus={() => alternarStatus(conta)}
                    onExcluir={() => excluirConta(conta)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {modalAberto ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
            onClick={fecharModal}
          />

          <div className="absolute right-0 top-0 h-full w-full max-w-3xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b bg-white px-6 py-5 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {editandoId ? "Editar conta" : "Nova conta"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Cadastre uma conta recorrente ou temporária.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fecharModal}
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8">
              <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Tipo da conta</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Escolha se a cobrança será contínua ou com prazo definido.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleTrocaTipoRecorrencia("indeterminada")}
                    className={cls(
                      "rounded-2xl border p-4 text-left transition",
                      tipoRecorrencia === "indeterminada"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                    )}
                  >
                    <p className="font-medium">Recorrente</p>
                    <p
                      className={cls(
                        "mt-1 text-sm",
                        tipoRecorrencia === "indeterminada"
                          ? "text-slate-200"
                          : "text-slate-500"
                      )}
                    >
                      Sem data final definida.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTrocaTipoRecorrencia("temporaria")}
                    className={cls(
                      "rounded-2xl border p-4 text-left transition",
                      tipoRecorrencia === "temporaria"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                    )}
                  >
                    <p className="font-medium">Temporária</p>
                    <p
                      className={cls(
                        "mt-1 text-sm",
                        tipoRecorrencia === "temporaria"
                          ? "text-slate-200"
                          : "text-slate-500"
                      )}
                    >
                      Com prazo por quantidade ou mês final.
                    </p>
                  </button>
                </div>
              </section>

              <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Dados principais
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Descrição</label>
                  <input
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Aluguel"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Valor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Dia do vencimento
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={diaVencimento}
                      onChange={(e) => setDiaVencimento(e.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Mês de início
                    </label>
                    <input
                      type="month"
                      value={inicioCobranca}
                      onChange={(e) => setInicioCobranca(e.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Categoria
                    </label>
                    <input
                      list="categorias-contas"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      placeholder="Ex: Moradia"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                    />
                    <datalist id="categorias-contas">
                      {categoriasDisponiveis.map((item) => (
                        <option key={item} value={item} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </section>

              {tipoRecorrencia === "temporaria" ? (
                <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Prazo da conta temporária
                  </h3>

                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleTrocaPrazoModo("quantidade")}
                      className={cls(
                        "rounded-2xl border p-4 text-left transition",
                        prazoModo === "quantidade"
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                      )}
                    >
                      <p className="font-medium">Quantidade de meses</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTrocaPrazoModo("fim")}
                      className={cls(
                        "rounded-2xl border p-4 text-left transition",
                        prazoModo === "fim"
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                      )}
                    >
                      <p className="font-medium">Mês final</p>
                    </button>
                  </div>

                  {prazoModo === "quantidade" ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Quantidade de meses
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={quantidadeMeses}
                        onChange={(e) => setQuantidadeMeses(e.target.value)}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Mês final
                      </label>
                      <input
                        type="month"
                        value={fimCobranca}
                        onChange={(e) => setFimCobranca(e.target.value)}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                      />
                    </div>
                  )}
                </section>
              ) : null}

              <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Informações adicionais
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Observações
                  </label>
                  <input
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Opcional"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <input
                    type="checkbox"
                    checked={ativa}
                    onChange={(e) => setAtiva(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-slate-700">Conta ativa</span>
                </label>
              </section>

              {erro ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {erro}
                </div>
              ) : null}

              <div className="sticky bottom-0 flex gap-3 border-t bg-white py-4">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
