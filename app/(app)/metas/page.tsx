"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Plus,
  Search,
  Target,
  TrendingUp,
  Wallet,
  Trash2,
} from "lucide-react";
import { normalizarNumero } from "@/lib/finance/format";

import type {
  MetaStatus,
  MetaPrioridade,
  MetaAporteTipo,
  MetaRow,
  MetaAporteRow,
  MetaCalculada,
  MetaFormState,
  AporteFormState,
} from "./_lib/types";

import {
  getHoje,
  formatarMoeda,
  classNames,
  diferencaMesesEntreDatas,
  somarAportesValidos,
  getMediaMensalAportes,
  getPrevisaoConclusaoTexto,
  formatarData,
  getPrioridadeLabel,
  getPercentual,
  getMetaFormInicial,
  getAporteFormInicial,
  calcularValorAtual,
} from "./_lib/utils";

import { Campo, Input, Textarea, Select } from "./_components/form-primitives";
import { InteligenciaMetasSection } from "./_components/inteligencia-metas-section";
import { MetaCard } from "./_components/meta-card";
import { MetasSkeleton } from "./_components/metas-skeleton";
import { ModalShell } from "./_components/modal-shell";
import { ResumoCard } from "./_components/resumo-card";

const supabase = createClient();

export default function MetasPage() {
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingAporte, setSavingAporte] = useState(false);

  const [metas, setMetas] = useState<MetaRow[]>([]);
  const [aportes, setAportes] = useState<MetaAporteRow[]>([]);

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"todas" | MetaStatus>("todas");
  const [ordenacao, setOrdenacao] = useState<
    "prioridade" | "prazo" | "mais_proximo" | "maior_percentual" | "menor_faltante"
  >("prioridade");

  const [erro, setErro] = useState<string | null>(null);

  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const [metaEmEdicao, setMetaEmEdicao] = useState<MetaRow | null>(null);
  const [metaForm, setMetaForm] = useState<MetaFormState>(getMetaFormInicial());

  const [aporteModalOpen, setAporteModalOpen] = useState(false);
  const [metaAporteAtual, setMetaAporteAtual] = useState<MetaCalculada | null>(null);
  const [aporteForm, setAporteForm] = useState<AporteFormState>(getAporteFormInicial());

  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);
  const [metaHistoricoAtual, setMetaHistoricoAtual] = useState<MetaCalculada | null>(
    null
  );
  const [aporteEditando, setAporteEditando] = useState<MetaAporteRow | null>(null);
  const [valorEditando, setValorEditando] = useState("");
  const [aporteInteligenteModalOpen, setAporteInteligenteModalOpen] = useState(false);
  const [metaInteligenteSelecionadaId, setMetaInteligenteSelecionadaId] = useState("");
  const [valorAporteInteligente, setValorAporteInteligente] = useState("");
  const [savingAporteInteligente, setSavingAporteInteligente] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setUserId(null);
        setMetas([]);
        setAportes([]);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const [{ data: metasData, error: metasError }, { data: aportesData, error: aportesError }] =
        await Promise.all([
          supabase
            .from("metas")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("meta_aportes")
            .select("*")
            .eq("user_id", user.id)
            .order("data", { ascending: false })
            .order("created_at", { ascending: false }),
        ]);

      if (metasError) throw metasError;
      if (aportesError) throw aportesError;

      setMetas((metasData ?? []) as MetaRow[]);
      setAportes((aportesData ?? []) as MetaAporteRow[]);
    } catch {
      setErro("Não foi possível carregar suas metas agora.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const metasCalculadas = useMemo<MetaCalculada[]>(() => {
    return metas.map((meta) => {
      const aportesDaMeta = aportes.filter((item) => item.meta_id === meta.id);
      const valorAtualCalculado = calcularValorAtual(meta, aportesDaMeta);
      const valorMetaNumero = normalizarNumero(meta.valor_meta);
      const valorInicialNumero = normalizarNumero(meta.valor_inicial);
      const faltante = Math.max(valorMetaNumero - valorAtualCalculado, 0);
      const percentual = getPercentual(valorAtualCalculado, valorMetaNumero);
      const totalAportado = somarAportesValidos(aportesDaMeta);
      const mediaMensalAportes = getMediaMensalAportes(aportesDaMeta);

      const mesesRestantes = meta.prazo
        ? Math.max(
            diferencaMesesEntreDatas(new Date(), new Date(`${meta.prazo}T12:00:00`)),
            0
          ) + 1
        : null;

      const valorIdealMensal =
        mesesRestantes && mesesRestantes > 0
          ? faltante / mesesRestantes
          : null;

      return {
        ...meta,
        valorMetaNumero,
        valorInicialNumero,
        valorAtualCalculado,
        faltante,
        percentual,
        aportesDaMeta,
        prazoFormatado: formatarData(meta.prazo),
        prioridadeLabel: getPrioridadeLabel(meta.prioridade),
        totalAportado,
        mediaMensalAportes,
        mesesRestantes,
        valorIdealMensal,
        previsaoConclusaoTexto: getPrevisaoConclusaoTexto(
          faltante,
          mediaMensalAportes,
          percentual
        ),
      };
    });
  }, [metas, aportes]);

  const metasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const base = metasCalculadas.filter((meta) => {
      const matchBusca =
        !termo ||
        meta.nome.toLowerCase().includes(termo) ||
        (meta.tipo ?? "").toLowerCase().includes(termo) ||
        (meta.descricao ?? "").toLowerCase().includes(termo);

      const matchStatus = statusFiltro === "todas" || meta.status === statusFiltro;

      return matchBusca && matchStatus;
    });

    const ordenadas = [...base].sort((a, b) => {
      if (ordenacao === "prioridade") {
        if (a.prioridade !== b.prioridade) return a.prioridade - b.prioridade;

        if (a.status === "ativa" && b.status !== "ativa") return -1;
        if (a.status !== "ativa" && b.status === "ativa") return 1;

        return a.nome.localeCompare(b.nome);
      }

      if (ordenacao === "prazo") {
        if (!a.prazo && !b.prazo) return a.nome.localeCompare(b.nome);
        if (!a.prazo) return 1;
        if (!b.prazo) return -1;
        return a.prazo.localeCompare(b.prazo);
      }

      if (ordenacao === "mais_proximo") {
        return b.valorAtualCalculado - a.valorAtualCalculado;
      }

      if (ordenacao === "maior_percentual") {
        return b.percentual - a.percentual;
      }

      if (ordenacao === "menor_faltante") {
        return a.faltante - b.faltante;
      }

      return 0;
    });

    return ordenadas;
  }, [busca, metasCalculadas, ordenacao, statusFiltro]);

  const resumo = useMemo(() => {
    const metasAtivas = metasCalculadas.filter((meta) => meta.status === "ativa");
    const metasConcluidas = metasCalculadas.filter(
      (meta) => meta.status === "concluida"
    );

    const totalGuardado = metasCalculadas.reduce(
      (acc, meta) => acc + meta.valorAtualCalculado,
      0
    );

    const inicioMes = `${getHoje().slice(0, 7)}-01`;

    const aporteMes = aportes.reduce((acc, item) => {
      if (item.data < inicioMes) return acc;
      const valor = normalizarNumero(item.valor);

      if (item.tipo === "aporte") return acc + valor;
      if (item.tipo === "retirada") return acc - valor;
      if (item.tipo === "ajuste") return acc + valor;

      return acc;
    }, 0);

    const metaMaisProxima = [...metasCalculadas]
      .filter((meta) => meta.status === "ativa" && meta.faltante > 0)
      .sort((a, b) => a.faltante - b.faltante)[0];

    return {
      totalGuardado,
      metasAtivas: metasAtivas.length,
      metasConcluidas: metasConcluidas.length,
      aporteMes,
      metaMaisProxima,
    };
  }, [aportes, metasCalculadas]);

  const inteligenciaMetas = useMemo(() => {
    const metasAtivas = metasCalculadas.filter((m) => m.status === "ativa" && m.faltante > 0);

    if (metasAtivas.length === 0) return null;

    const maisProxima = [...metasAtivas].sort((a, b) => a.faltante - b.faltante)[0];

    const maisAtrasada = [...metasAtivas].sort((a, b) => a.percentual - b.percentual)[0];

    const maisUrgente = [...metasAtivas].sort((a, b) => {
      return (b.faltante / b.valorMetaNumero) - (a.faltante / a.valorMetaNumero);
    })[0];

    const valorSugerido = Math.min(
      Number(maisUrgente.faltante || 0),
      Math.max(50, Number((Number(maisUrgente.faltante || 0) * 0.1).toFixed(2)))
    );

    return {
      maisProxima,
      maisAtrasada,
      maisUrgente,
      valorSugerido,
    };
  }, [metasCalculadas]);

  function abrirNovaMeta() {
    setMetaEmEdicao(null);
    setMetaForm(getMetaFormInicial());
    setMetaModalOpen(true);
  }

  function abrirEditarMeta(meta: MetaCalculada) {
    setMetaEmEdicao(meta);
    setMetaForm({
      nome: meta.nome ?? "",
      descricao: meta.descricao ?? "",
      tipo: meta.tipo ?? "",
      valorMeta: String(meta.valorMetaNumero || 0),
      valorInicial: String(meta.valorInicialNumero || 0),
      prazo: meta.prazo ?? "",
      prioridade: (meta.prioridade as MetaPrioridade) ?? 2,
      status: meta.status,
      considerarNaDashboard: meta.considerar_na_dashboard,
    });
    setMetaModalOpen(true);
  }

  function abrirAporte(meta: MetaCalculada) {
    setMetaAporteAtual(meta);
    setAporteForm(getAporteFormInicial());
    setAporteModalOpen(true);
  }

  function abrirHistorico(meta: MetaCalculada) {
    setMetaHistoricoAtual(meta);
    setHistoricoModalOpen(true);
  }

  async function salvarMeta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userId) {
      setErro("Você precisa estar logado para cadastrar metas.");
      return;
    }

    if (!metaForm.nome.trim()) {
      setErro("Informe o nome da meta.");
      return;
    }

    if (!metaForm.valorMeta || Number(metaForm.valorMeta) <= 0) {
      setErro("Informe um valor alvo válido para a meta.");
      return;
    }

    try {
      setSavingMeta(true);
      setErro(null);

      const payload = {
        user_id: userId,
        nome: metaForm.nome.trim(),
        descricao: metaForm.descricao.trim() || null,
        tipo: metaForm.tipo.trim() || null,
        valor_meta: Number(metaForm.valorMeta || 0),
        valor_inicial: Number(metaForm.valorInicial || 0),
        prazo: metaForm.prazo || null,
        prioridade: Number(metaForm.prioridade),
        status: metaForm.status,
        considerar_na_dashboard: metaForm.considerarNaDashboard,
        updated_at: new Date().toISOString(),
      };

      if (metaEmEdicao) {
        const { error } = await supabase
          .from("metas")
          .update(payload)
          .eq("id", metaEmEdicao.id)
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("metas").insert(payload);

        if (error) throw error;
      }

      setMetaModalOpen(false);
      setMetaEmEdicao(null);
      setMetaForm(getMetaFormInicial());
      await carregarDados();
    } catch {
      setErro("Não foi possível salvar a meta.");
    } finally {
      setSavingMeta(false);
    }
  }

  async function excluirMeta(meta: MetaCalculada) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir a meta "${meta.nome}"?`
    );
    if (!confirmar || !userId) return;

    try {
      setErro(null);

      const { error } = await supabase
        .from("metas")
        .delete()
        .eq("id", meta.id)
        .eq("user_id", userId);

      if (error) throw error;

      await carregarDados();
    } catch {
      setErro("Não foi possível excluir a meta.");
    }
  }

  async function atualizarStatus(meta: MetaCalculada, status: MetaStatus) {
    if (!userId) return;

    try {
      setErro(null);

      const { error } = await supabase
        .from("metas")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", meta.id)
        .eq("user_id", userId);

      if (error) throw error;

      await carregarDados();
    } catch {
      setErro("Não foi possível atualizar o status da meta.");
    }
  }

  async function salvarAporte(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userId || !metaAporteAtual) {
      setErro("Meta inválida para lançamento.");
      return;
    }

    if (!aporteForm.valor || Number(aporteForm.valor) <= 0) {
      setErro("Informe um valor válido.");
      return;
    }

    try {
      setSavingAporte(true);
      setErro(null);

      const valorNumerico = Number(aporteForm.valor || 0);
      const dataLancamento = aporteForm.data || getHoje();

      const payloadAporte = {
        user_id: userId,
        meta_id: metaAporteAtual.id,
        tipo: aporteForm.tipo,
        valor: valorNumerico,
        descricao: aporteForm.descricao.trim() || null,
        data: dataLancamento,
      };

      const { data: aporteCriado, error: aporteError } = await supabase
        .from("meta_aportes")
        .insert(payloadAporte)
        .select()
        .single();

      if (aporteError) throw aporteError;

      const descricaoMovimentacao =
        aporteForm.descricao.trim() ||
        `${aporteForm.tipo === "retirada" ? "Retirada" : "Aporte"} - ${metaAporteAtual.nome}`;

      const categoriaMovimentacao =
        aporteForm.tipo === "retirada" ? "retirada_meta" : "aporte_meta";

      const { error: movimentacaoError } = await supabase
        .from("movimentacoes")
        .insert({
          tipo: "despesa",
          descricao: descricaoMovimentacao,
          categoria: categoriaMovimentacao,
          valor: valorNumerico,
          data: dataLancamento,
          tipo_pagamento: "pix_dinheiro",
          cartao_id: null,
          parcelas: null,
          primeira_cobranca: null,
          meta_id: metaAporteAtual.id,
          meta_aporte_id: aporteCriado.id,
        });

      if (movimentacaoError) {
        await supabase.from("meta_aportes").delete().eq("id", aporteCriado.id);
        throw movimentacaoError;
      }

      setAporteModalOpen(false);
      setMetaAporteAtual(null);
      setAporteForm(getAporteFormInicial());

      await carregarDados();
    } catch {
      setErro("Não foi possível salvar o lançamento da meta.");
    } finally {
      setSavingAporte(false);
    }
  }

  async function excluirAporte(item: MetaAporteRow) {
    const confirmar = window.confirm("Deseja excluir este lançamento?");
    if (!confirmar || !userId) return;

    try {
      setErro(null);

      const { error } = await supabase
        .from("meta_aportes")
        .delete()
        .eq("id", item.id)
        .eq("user_id", userId);

      if (error) throw error;

      await carregarDados();
    } catch {
      setErro("Não foi possível excluir o lançamento.");
    }
  }

  async function confirmarAporteInteligente() {
    if (!userId) {
      setErro("Você precisa estar logado para registrar um aporte.");
      return;
    }

    if (!metaInteligenteSelecionadaId) {
      setErro("Selecione uma meta para continuar.");
      return;
    }

    const meta = metasCalculadas.find((item) => item.id === metaInteligenteSelecionadaId);

    if (!meta) {
      setErro("Meta não encontrada.");
      return;
    }

    const valorNumerico = Number(valorAporteInteligente || 0);

    if (valorNumerico <= 0) {
      setErro("Informe um valor válido para o aporte.");
      return;
    }

    try {
      setSavingAporteInteligente(true);
      setErro(null);

      const dataLancamento = getHoje();

      const { data: aporteCriado, error: aporteError } = await supabase
        .from("meta_aportes")
        .insert({
          user_id: userId,
          meta_id: meta.id,
          tipo: "aporte",
          valor: valorNumerico,
          descricao: `Aporte inteligente - ${meta.nome}`,
          data: dataLancamento,
        })
        .select()
        .single();

      if (aporteError) throw aporteError;

      const { error: movimentacaoError } = await supabase
        .from("movimentacoes")
        .insert({
          tipo: "despesa",
          descricao: `Aporte inteligente - ${meta.nome}`,
          categoria: "aporte_meta",
          valor: valorNumerico,
          data: dataLancamento,
          tipo_pagamento: "pix_dinheiro",
          cartao_id: null,
          parcelas: null,
          primeira_cobranca: null,
          meta_id: meta.id,
          meta_aporte_id: aporteCriado.id,
        });

      if (movimentacaoError) {
        await supabase.from("meta_aportes").delete().eq("id", aporteCriado.id);
        throw movimentacaoError;
      }

      setAporteInteligenteModalOpen(false);
      setMetaInteligenteSelecionadaId("");
      setValorAporteInteligente("");

      await carregarDados();
    } catch {
      setErro("Não foi possível executar o aporte inteligente.");
    } finally {
      setSavingAporteInteligente(false);
    }
  }

  function abrirModalAporteInteligente() {
    if (!inteligenciaMetas?.maisUrgente) {
      setErro("Nenhuma meta disponível para aporte inteligente.");
      return;
    }

    setErro(null);
    setMetaInteligenteSelecionadaId(inteligenciaMetas.maisUrgente.id);
    setValorAporteInteligente(String(inteligenciaMetas.valorSugerido));
    setAporteInteligenteModalOpen(true);
  }

  const metaInteligenteSelecionada = useMemo(() => {
    if (!metaInteligenteSelecionadaId) return null;

    return metasCalculadas.find(
      (item) => item.id === metaInteligenteSelecionadaId
    ) ?? null;
  }, [metaInteligenteSelecionadaId, metasCalculadas]);

  if (loading) {
    return <MetasSkeleton />;
  }

  if (!userId) {
    return (
      <div className="rounded-4x1 border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          Metas
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          Faça login para visualizar suas metas
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
          Assim que você entrar na sua conta, esta página poderá listar, criar e
          acompanhar suas metas financeiras.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-4x1 border border-slate-200 bg-linear-to-r from-white to-slate-50 px-6 py-8 shadow-sm md:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              <Target className="h-3.5 w-3.5" />
              Gestão de metas
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
              Metas
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
              Crie, acompanhe e organize seus objetivos financeiros com histórico
              de aportes, progresso e leitura rápida do que ainda falta.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirNovaMeta}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Nova meta
          </button>
        </div>
      </section>

      {erro ? (
        <div className="rounded-3x1 border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm">
          {erro}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          titulo="Total guardado"
          valor={formatarMoeda(resumo.totalGuardado)}
          subtitulo="Soma do valor atual de todas as metas."
          icon={<Wallet className="h-5 w-5" />}
          tone="emerald"
        />

        <ResumoCard
          titulo="Metas ativas"
          valor={String(resumo.metasAtivas)}
          subtitulo="Objetivos em andamento no momento."
          icon={<Target className="h-5 w-5" />}
        />

        <ResumoCard
          titulo="Aporte no mês"
          valor={formatarMoeda(resumo.aporteMes)}
          subtitulo="Entradas e ajustes do mês atual nas metas."
          icon={<TrendingUp className="h-5 w-5" />}
          tone="blue"
        />

        <ResumoCard
          titulo="Próxima meta"
          valor={
            resumo.metaMaisProxima
              ? formatarMoeda(resumo.metaMaisProxima.faltante)
              : "—"
          }
          subtitulo={
            resumo.metaMaisProxima
              ? `${resumo.metaMaisProxima.nome} é a mais próxima de concluir.`
              : "Nenhuma meta ativa pendente no momento."
          }
          icon={<CalendarDays className="h-5 w-5" />}
          tone="orange"
        />
      </section>

      {inteligenciaMetas && (
        <InteligenciaMetasSection
          inteligencia={inteligenciaMetas}
          onAporteInteligente={abrirModalAporteInteligente}
        />
      )}

      <section className="rounded-4x1border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-4 border-b border-slate-200 px-6 py-5 xl:grid-cols-[1.3fr_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, tipo ou descrição..."
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-slate-400"
            />
          </div>

          <Select
            value={statusFiltro}
            onChange={(e) =>
              setStatusFiltro(e.target.value as "todas" | MetaStatus)
            }
          >
            <option value="todas">Todas as metas</option>
            <option value="ativa">Ativas</option>
            <option value="pausada">Pausadas</option>
            <option value="concluida">Concluídas</option>
            <option value="cancelada">Canceladas</option>
          </Select>

          <Select
            value={ordenacao}
            onChange={(e) =>
              setOrdenacao(
                e.target.value as
                  | "prioridade"
                  | "prazo"
                  | "mais_proximo"
                  | "maior_percentual"
                  | "menor_faltante"
              )
            }
          >
            <option value="prioridade">Ordenar por prioridade</option>
            <option value="prazo">Ordenar por prazo</option>
            <option value="mais_proximo">Mais próximas</option>
            <option value="maior_percentual">Maior progresso</option>
            <option value="menor_faltante">Menor valor faltante</option>
          </Select>
        </div>

        <div className="p-6">
          {metasFiltradas.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <p className="text-lg font-semibold text-slate-900">
                Nenhuma meta encontrada
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Crie sua primeira meta ou ajuste os filtros para visualizar os
                resultados.
              </p>

              <button
                type="button"
                onClick={abrirNovaMeta}
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Criar meta
              </button>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {metasFiltradas.map((meta) => (
                <MetaCard
                  key={meta.id}
                  meta={meta}
                  onAporte={abrirAporte}
                  onHistorico={abrirHistorico}
                  onEditar={abrirEditarMeta}
                  onPausar={(m) => atualizarStatus(m, "pausada")}
                  onReativar={(m) => atualizarStatus(m, "ativa")}
                  onConcluir={(m) => atualizarStatus(m, "concluida")}
                  onExcluir={excluirMeta}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {metaModalOpen ? (
        <ModalShell
          title={metaEmEdicao ? "Editar meta" : "Nova meta"}
          subtitle="Preencha as informações principais da meta. O valor atual será calculado com base no valor inicial e nos lançamentos registrados."
          onClose={() => {
            setMetaModalOpen(false);
            setMetaEmEdicao(null);
            setMetaForm(getMetaFormInicial());
          }}
        >
          <form onSubmit={salvarMeta} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Campo label="Nome da meta">
                <Input
                  value={metaForm.nome}
                  onChange={(e) =>
                    setMetaForm((prev) => ({ ...prev, nome: e.target.value }))
                  }
                  placeholder="Ex.: Impressora 3D"
                />
              </Campo>

              <Campo label="Tipo">
                <Input
                  value={metaForm.tipo}
                  onChange={(e) =>
                    setMetaForm((prev) => ({ ...prev, tipo: e.target.value }))
                  }
                  placeholder="Ex.: Equipamento, viagem, reserva..."
                />
              </Campo>
            </div>

            <Campo label="Descrição">
              <Textarea
                value={metaForm.descricao}
                onChange={(e) =>
                  setMetaForm((prev) => ({
                    ...prev,
                    descricao: e.target.value,
                  }))
                }
                placeholder="Detalhes opcionais sobre essa meta..."
              />
            </Campo>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <Campo label="Valor alvo">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={metaForm.valorMeta}
                  onChange={(e) =>
                    setMetaForm((prev) => ({
                      ...prev,
                      valorMeta: e.target.value,
                    }))
                  }
                  placeholder="0,00"
                />
              </Campo>

              <Campo label="Valor inicial">
                <Input
                  type="number"
                  step="0.01"
                  value={metaForm.valorInicial}
                  onChange={(e) =>
                    setMetaForm((prev) => ({
                      ...prev,
                      valorInicial: e.target.value,
                    }))
                  }
                  placeholder="0,00"
                />
              </Campo>

              <Campo label="Prazo">
                <Input
                  type="date"
                  value={metaForm.prazo}
                  onChange={(e) =>
                    setMetaForm((prev) => ({ ...prev, prazo: e.target.value }))
                  }
                />
              </Campo>

              <Campo label="Prioridade">
                <Select
                  value={String(metaForm.prioridade)}
                  onChange={(e) =>
                    setMetaForm((prev) => ({
                      ...prev,
                      prioridade: Number(e.target.value) as MetaPrioridade,
                    }))
                  }
                >
                  <option value="1">Alta</option>
                  <option value="2">Média</option>
                  <option value="3">Baixa</option>
                </Select>
              </Campo>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Campo label="Status">
                <Select
                  value={metaForm.status}
                  onChange={(e) =>
                    setMetaForm((prev) => ({
                      ...prev,
                      status: e.target.value as MetaStatus,
                    }))
                  }
                >
                  <option value="ativa">Ativa</option>
                  <option value="pausada">Pausada</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                </Select>
              </Campo>

              <Campo label="Exibir na dashboard">
                <div className="flex h-12 items-center rounded-2xl border border-slate-300 px-4">
                  <input
                    id="considerar_na_dashboard"
                    type="checkbox"
                    checked={metaForm.considerarNaDashboard}
                    onChange={(e) =>
                      setMetaForm((prev) => ({
                        ...prev,
                        considerarNaDashboard: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <label
                    htmlFor="considerar_na_dashboard"
                    className="ml-3 text-sm text-slate-700"
                  >
                    Mostrar essa meta no resumo da dashboard
                  </label>
                </div>
              </Campo>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={() => {
                  setMetaModalOpen(false);
                  setMetaEmEdicao(null);
                  setMetaForm(getMetaFormInicial());
                }}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={savingMeta}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingMeta
                  ? "Salvando..."
                  : metaEmEdicao
                  ? "Salvar alterações"
                  : "Criar meta"}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {aporteModalOpen && metaAporteAtual ? (
        <ModalShell
          title={`Novo lançamento • ${metaAporteAtual.nome}`}
          subtitle="Registre um aporte, retirada ou ajuste para atualizar o progresso da meta."
          onClose={() => {
            setAporteModalOpen(false);
            setMetaAporteAtual(null);
            setAporteForm(getAporteFormInicial());
          }}
          maxWidth="max-w-xl"
        >
          <form onSubmit={salvarAporte} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Campo label="Tipo">
                <Select
                  value={aporteForm.tipo}
                  onChange={(e) =>
                    setAporteForm((prev) => ({
                      ...prev,
                      tipo: e.target.value as MetaAporteTipo,
                    }))
                  }
                >
                  <option value="aporte">Aporte</option>
                  <option value="retirada">Retirada</option>
                  <option value="ajuste">Ajuste</option>
                </Select>
              </Campo>

              <Campo label="Data">
                <Input
                  type="date"
                  value={aporteForm.data}
                  onChange={(e) =>
                    setAporteForm((prev) => ({
                      ...prev,
                      data: e.target.value,
                    }))
                  }
                />
              </Campo>
            </div>

            <Campo label="Valor">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={aporteForm.valor}
                onChange={(e) =>
                  setAporteForm((prev) => ({
                    ...prev,
                    valor: e.target.value,
                  }))
                }
                placeholder="0,00"
              />
            </Campo>

            <Campo label="Descrição">
              <Textarea
                value={aporteForm.descricao}
                onChange={(e) =>
                  setAporteForm((prev) => ({
                    ...prev,
                    descricao: e.target.value,
                  }))
                }
                placeholder="Ex.: aporte mensal, retirada emergencial, ajuste manual..."
              />
            </Campo>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={() => {
                  setAporteModalOpen(false);
                  setMetaAporteAtual(null);
                  setAporteForm(getAporteFormInicial());
                }}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={savingAporte}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingAporte ? "Salvando..." : "Salvar lançamento"}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {historicoModalOpen && metaHistoricoAtual ? (
        <ModalShell
          title={`Histórico • ${metaHistoricoAtual.nome}`}
          subtitle="Aqui você acompanha todos os lançamentos registrados para essa meta."
          onClose={() => {
            setHistoricoModalOpen(false);
            setMetaHistoricoAtual(null);
          }}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Guardado
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {formatarMoeda(metaHistoricoAtual.valorAtualCalculado)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Meta
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {formatarMoeda(metaHistoricoAtual.valorMetaNumero)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Faltante
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {formatarMoeda(metaHistoricoAtual.faltante)}
                </p>
              </div>
            </div>

            {metaHistoricoAtual.aportesDaMeta.length === 0 ? (
              <div className="rounded-3x1 border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                <p className="text-base font-semibold text-slate-900">
                  Ainda não há lançamentos nesta meta
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Registre aportes, retiradas ou ajustes para acompanhar a evolução.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {metaHistoricoAtual.aportesDaMeta.map((item) => {
                  const isAporte = item.tipo === "aporte";
                  const isRetirada = item.tipo === "retirada";

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setAporteEditando(item);
                        setValorEditando(String(item.valor));
                      }}
                      className="rounded-3x1 border border-slate-200 bg-white px-5 py-4 shadow-sm cursor-pointer hover:bg-slate-50"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={classNames(
                                "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                isAporte
                                  ? "bg-emerald-50 text-emerald-700"
                                  : isRetirada
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-blue-50 text-blue-700"
                              )}
                            >
                              {isAporte ? (
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              ) : isRetirada ? (
                                <ArrowDownLeft className="h-3.5 w-3.5" />
                              ) : (
                                <TrendingUp className="h-3.5 w-3.5" />
                              )}
                              {item.tipo}
                            </span>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                              {formatarData(item.data)}
                            </span>
                          </div>

                          {item.descricao ? (
                            <p className="mt-3 text-sm leading-relaxed text-slate-500">
                              {item.descricao}
                            </p>
                          ) : (
                            <p className="mt-3 text-sm text-slate-400">
                              Sem descrição informada.
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p
                              className={classNames(
                                "text-lg font-semibold",
                                isAporte
                                  ? "text-emerald-600"
                                  : isRetirada
                                  ? "text-rose-600"
                                  : "text-blue-600"
                              )}
                            >
                              {isRetirada ? "- " : "+ "}
                              {formatarMoeda(normalizarNumero(item.valor))}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => excluirAporte(item)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ModalShell>
      ) : null}

      {aporteEditando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-semibold">Editar aporte</h2>

            <input
              value={valorEditando}
              onChange={(e) => setValorEditando(e.target.value)}
              className="w-full border rounded-xl p-3"
            />

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await supabase
                    .from("meta_aportes")
                    .update({ valor: Number(valorEditando) })
                    .eq("id", aporteEditando.id);

                  setAporteEditando(null);
                  carregarDados();
                }}
                className="flex-1 bg-black text-white rounded-xl p-3"
              >
                Salvar
              </button>

              <button
                onClick={async () => {
                  await supabase
                    .from("meta_aportes")
                    .delete()
                    .eq("id", aporteEditando.id);

                  setAporteEditando(null);
                  carregarDados();
                }}
                className="flex-1 border rounded-xl p-3"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {aporteInteligenteModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Aporte inteligente</h2>

            <select
              value={metaInteligenteSelecionadaId}
              onChange={(e) => setMetaInteligenteSelecionadaId(e.target.value)}
              className="w-full border rounded-xl p-3"
            >
              {metasCalculadas
                .filter((m) => m.status === "ativa" && m.faltante > 0)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
            </select>

            <input
              type="number"
              value={valorAporteInteligente}
              onChange={(e) => setValorAporteInteligente(e.target.value)}
              className="w-full border rounded-xl p-3"
            />

            {metaInteligenteSelecionada && (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                    Guardado
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {formatarMoeda(metaInteligenteSelecionada.valorAtualCalculado)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                    Falta
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {formatarMoeda(metaInteligenteSelecionada.faltante)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                    Progresso
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {metaInteligenteSelecionada.percentual.toFixed(0)}%
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                    Ideal por mês
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {metaInteligenteSelecionada.valorIdealMensal !== null
                      ? formatarMoeda(metaInteligenteSelecionada.valorIdealMensal)
                      : "Sem prazo"}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAporteInteligenteModalOpen(false);
                  setMetaInteligenteSelecionadaId("");
                  setValorAporteInteligente("");
                }}
                className="flex-1 border rounded-xl p-3"
              >
                Cancelar
              </button>

              <button
                onClick={confirmarAporteInteligente}
                disabled={savingAporteInteligente}
                className="flex-1 bg-black text-white rounded-xl p-3 disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
