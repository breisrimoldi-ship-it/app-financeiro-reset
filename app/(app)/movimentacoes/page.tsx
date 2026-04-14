"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRightLeft, Plus, Search, SlidersHorizontal, Tag } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/ui/section-card";
import { createClient } from "@/lib/supabase/client";

import type {
  Cartao,
  CategoryManagerTab,
  CategoryOption,
  DbCartao,
  DbMovimentacao,
  DbMovimentacaoCategoria,
  FormType,
  Movimentacao,
  PaymentType,
  TabType,
} from "./_lib/types";

import {
  CATEGORIAS_PADRAO_DESPESA,
  CATEGORIAS_PADRAO_ENTRADA,
  calcularPrimeiraCobranca,
  formatCompetencia,
  formatCurrency,
  formatTipoPagamento,
  getDataLabel,
  getInitialFormData,
  getMesAtual,
  mapDbToUi,
  resolveCategoryLabel,
  slugify,
} from "./_lib/utils";

import { CardDespesaPremium } from "./_components/card-despesa";
import { CardEntradaPremium } from "./_components/card-entrada";
import { EmptyStatePremium } from "./_components/empty-state";
import { FiltroChip } from "./_components/filtro-chip";
import { ModalCategorias } from "./_components/modal-categorias";
import { ModalDetalhes } from "./_components/modal-detalhes";
import { ModalMovimentacao } from "./_components/modal-movimentacao";
import { ModalTransferencia } from "./_components/modal-transferencia";
import { ResumoCard } from "./_components/resumo-card";
import { SaldoContas } from "./_components/saldo-contas";

const supabase = createClient();

export default function MovimentacoesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [formType, setFormType] = useState<FormType>("entrada");
  const [activeTab, setActiveTab] = useState<TabType>("entradas");
  const [search, setSearch] = useState("");
  const [mesSelecionado, setMesSelecionado] = useState(getMesAtual());
  const [filtroCategoriaEntrada, setFiltroCategoriaEntrada] = useState("todas");
  const [filtroCategoriaDespesa, setFiltroCategoriaDespesa] = useState("todas");
  const [filtroPagamentoDespesa, setFiltroPagamentoDespesa] = useState<
    "todos" | PaymentType
  >("todos");
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<Movimentacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoriasOpen, setCategoriasOpen] = useState(false);
  const [categoriaTab, setCategoriaTab] =
    useState<CategoryManagerTab>("entrada");
  const [categoriasEntrada, setCategoriasEntrada] = useState<CategoryOption[]>(
    []
  );
  const [categoriasDespesa, setCategoriasDespesa] = useState<CategoryOption[]>(
    []
  );
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("");
  const [editingCategoriaId, setEditingCategoriaId] = useState<string | null>(
    null
  );
  const [editingCategoriaNome, setEditingCategoriaNome] = useState("");

  const [formData, setFormData] = useState(getInitialFormData());
  const [transferenciaOpen, setTransferenciaOpen] = useState(false);
  const [contasBancarias, setContasBancarias] = useState<
    { id: string; nome: string; tipo: string; saldo_inicial: number }[]
  >([]);

  const categoriasAtuais =
    formType === "entrada" ? categoriasEntrada : categoriasDespesa;

  const categoriasGerenciadasAtuais =
    categoriaTab === "entrada" ? categoriasEntrada : categoriasDespesa;

  const todasCategorias = useMemo(
    () => [...categoriasEntrada, ...categoriasDespesa],
    [categoriasEntrada, categoriasDespesa]
  );

  const cartoesMap = useMemo(
    () => new Map(cartoes.map((cartao) => [cartao.id, cartao.nome])),
    [cartoes]
  );

  const contasMap = useMemo(
    () => new Map(contasBancarias.map((c) => [c.id, c.nome])),
    [contasBancarias]
  );

  const primeiraCobrancaSugerida = useMemo(() => {
    if (formType !== "despesa") return "";
    if (formData.tipoPagamento !== "credito") return "";
    if (!formData.data || !formData.cartaoId) return "";

    return calcularPrimeiraCobranca(
      formData.data,
      Number(formData.cartaoId),
      cartoes
    );
  }, [
    cartoes,
    formData.cartaoId,
    formData.data,
    formData.tipoPagamento,
    formType,
  ]);

  const seedCategoriasPadrao = useCallback(async (userId: string) => {
    const payload = [
      ...CATEGORIAS_PADRAO_ENTRADA.map((item) => ({
        user_id: userId,
        tipo: "entrada" as const,
        nome: item.nome,
        slug: item.slug,
        ordem: item.ordem,
        ativa: true,
      })),
      ...CATEGORIAS_PADRAO_DESPESA.map((item) => ({
        user_id: userId,
        tipo: "despesa" as const,
        nome: item.nome,
        slug: item.slug,
        ordem: item.ordem,
        ativa: true,
      })),
    ];

    const { error } = await supabase
      .from("movimentacoes_categorias")
      .upsert(payload, { onConflict: "user_id,tipo,slug" });

    if (error) {
      throw error;
    }
  }, []);

  const carregarCategorias = useCallback(async () => {
    setLoadingCategorias(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      setLoadingCategorias(false);
      return;
    }

    if (!user) {
      setCategoriasEntrada([]);
      setCategoriasDespesa([]);
      setLoadingCategorias(false);
      return;
    }

    const { data: categoriasData, error: categoriasError } = await supabase
      .from("movimentacoes_categorias")
      .select("id, tipo, nome, slug, ordem, ativa")
      .eq("ativa", true)
      .order("ordem", { ascending: true })
      .order("nome", { ascending: true });

    if (categoriasError) {
      alert("Erro ao carregar categorias.");
      setLoadingCategorias(false);
      return;
    }

    let data = categoriasData;

    if (!data || data.length === 0) {
      await seedCategoriasPadrao(user.id);

      const secondLoad = await supabase
        .from("movimentacoes_categorias")
        .select("id, tipo, nome, slug, ordem, ativa")
        .eq("ativa", true)
        .order("ordem", { ascending: true })
        .order("nome", { ascending: true });

      if (secondLoad.error) {
        alert("Erro ao carregar categorias.");
        setLoadingCategorias(false);
        return;
      }

      data = secondLoad.data;
    }

    const rows = (data as DbMovimentacaoCategoria[] | null) ?? [];
    const entradas = rows
      .filter((item) => item.tipo === "entrada")
      .map((item) => ({
        id: item.id,
        label: item.nome,
        slug: item.slug,
        ordem: item.ordem ?? 0,
      }));

    const despesas = rows
      .filter((item) => item.tipo === "despesa")
      .map((item) => ({
        id: item.id,
        label: item.nome,
        slug: item.slug,
        ordem: item.ordem ?? 0,
      }));

    setCategoriasEntrada(entradas);
    setCategoriasDespesa(despesas);
    setLoadingCategorias(false);
  }, [seedCategoriasPadrao]);

  const carregarMovimentacoes = useCallback(async () => {
    const { data, error } = await supabase
      .from("movimentacoes")
      .select("*")
      .order("data", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erro ao carregar movimentações do Supabase.");
      return;
    }

    setMovimentacoes((data ?? []).map(mapDbToUi));
  }, []);

  const carregarCartoes = useCallback(async () => {
    const { data, error } = await supabase
      .from("cartoes")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      alert("Erro ao carregar cartões do Supabase.");
      return;
    }

    setCartoes(
      ((data as DbCartao[] | null) ?? []).map((cartao) => ({
        id: cartao.id,
        nome: cartao.nome,
        fechamentoDia: cartao.fechamento_dia,
        vencimentoDia: cartao.vencimento_dia,
      }))
    );
  }, []);

  const carregarContasBancarias = useCallback(async () => {
    const { data } = await supabase
      .from("contas_bancarias")
      .select("id, nome, tipo, saldo_inicial")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    setContasBancarias((data ?? []) as { id: string; nome: string; tipo: string; saldo_inicial: number }[]);
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([
        carregarMovimentacoes(),
        carregarCartoes(),
        carregarCategorias(),
        carregarContasBancarias(),
      ]);
      setLoading(false);
    }

    void init();
  }, [carregarCategorias, carregarMovimentacoes, carregarCartoes, carregarContasBancarias]);

  useEffect(() => {
    const abrir = searchParams.get("abrir");

    if (abrir !== "entrada" && abrir !== "despesa") return;

    const frame = requestAnimationFrame(() => {
      setEditingId(null);
      setSelectedItem(null);
      setFormData(getInitialFormData());
      setFormType(abrir);
      setActiveTab(abrir === "entrada" ? "entradas" : "despesas");
      setSheetOpen(true);
      router.replace("/movimentacoes", { scroll: false });
    });

    return () => cancelAnimationFrame(frame);
  }, [router, searchParams]);

  function resetForm() {
    setFormData(getInitialFormData());
    setEditingId(null);
  }

  function limparFiltrosListagem() {
    setSearch("");
    setFiltroCategoriaEntrada("todas");
    setFiltroCategoriaDespesa("todas");
    setFiltroPagamentoDespesa("todos");
  }

  function openSheet(type: FormType) {
    setFormType(type);
    resetForm();
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    resetForm();
  }

  function openCategorias(tab: CategoryManagerTab = "entrada") {
    setCategoriaTab(tab);
    setNovaCategoriaNome("");
    setEditingCategoriaId(null);
    setEditingCategoriaNome("");
    setCategoriasOpen(true);
  }

  function closeCategorias() {
    setCategoriasOpen(false);
    setNovaCategoriaNome("");
    setEditingCategoriaId(null);
    setEditingCategoriaNome("");
  }

  function startEditCategoria(categoria: CategoryOption) {
    setEditingCategoriaId(categoria.id);
    setEditingCategoriaNome(categoria.label);
  }

  function cancelEditCategoria() {
    setEditingCategoriaId(null);
    setEditingCategoriaNome("");
  }

  async function handleAddCategoria() {
    const nome = novaCategoriaNome.trim();

    if (!nome) {
      alert("Informe o nome da categoria.");
      return;
    }

    const listaAtual =
      categoriaTab === "entrada" ? categoriasEntrada : categoriasDespesa;
    const slug = slugify(nome);

    const jaExiste = listaAtual.some(
      (categoria) =>
        categoria.label.trim().toLowerCase() === nome.toLowerCase() ||
        categoria.slug === slug
    );

    if (jaExiste) {
      alert("Já existe uma categoria com esse nome.");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Usuário não autenticado.");
      return;
    }

    const ordemBase =
      listaAtual.reduce(
        (maior, categoria) => Math.max(maior, categoria.ordem ?? 0),
        0
      ) + 1;

    const { error } = await supabase.from("movimentacoes_categorias").insert({
      user_id: user.id,
      tipo: categoriaTab,
      nome,
      slug,
      ordem: ordemBase,
      ativa: true,
    });

    if (error) {
      alert("Erro ao criar categoria.");
      return;
    }

    setNovaCategoriaNome("");
    await carregarCategorias();
  }

  async function handleSaveCategoriaEdit() {
    const nome = editingCategoriaNome.trim();

    if (!editingCategoriaId) return;

    if (!nome) {
      alert("Informe o nome da categoria.");
      return;
    }

    const listaAtual =
      categoriaTab === "entrada" ? categoriasEntrada : categoriasDespesa;
    const slug = slugify(nome);

    const jaExiste = listaAtual.some(
      (categoria) =>
        categoria.id !== editingCategoriaId &&
        (categoria.label.trim().toLowerCase() === nome.toLowerCase() ||
          categoria.slug === slug)
    );

    if (jaExiste) {
      alert("Já existe uma categoria com esse nome.");
      return;
    }

    const { error } = await supabase
      .from("movimentacoes_categorias")
      .update({ nome, slug })
      .eq("id", editingCategoriaId);

    if (error) {
      alert("Erro ao editar categoria.");
      return;
    }

    cancelEditCategoria();
    await carregarCategorias();
  }

  async function handleDeleteCategoria(categoria: CategoryOption) {
    const emUso = movimentacoes.some((item) => item.categoria === categoria.id);

    if (emUso) {
      alert("Essa categoria já está em uso e não pode ser excluída agora.");
      return;
    }

    const confirmar = window.confirm(
      `Deseja excluir a categoria "${categoria.label}"?`
    );
    if (!confirmar) return;

    const { error } = await supabase
      .from("movimentacoes_categorias")
      .update({ ativa: false })
      .eq("id", categoria.id);

    if (error) {
      alert("Erro ao excluir categoria.");
      return;
    }

    if (editingCategoriaId === categoria.id) {
      cancelEditCategoria();
    }

    await carregarCategorias();
  }

  function handleEdit(item: Movimentacao) {
    if (item.tipo === "transferencia") return;
    setEditingId(item.id);
    setFormType(item.tipo);
    setFormData({
      descricao: item.descricao,
      categoria: item.categoria,
      valor: String(item.valor),
      data: item.data,
      tipoPagamento: item.tipoPagamento ?? "pix_dinheiro",
      cartaoId: item.cartaoId ? String(item.cartaoId) : "",
      parcelas: item.parcelas ? String(item.parcelas) : "",
      primeiraCobranca: item.primeiraCobranca ?? "",
      contaId: item.contaId ?? "",
    });
    setSheetOpen(true);
  }

  async function handleDelete(id: number) {
    const confirmar = window.confirm("Deseja excluir esta movimentação?");
    if (!confirmar) return;

    const { error } = await supabase.rpc(
      "excluir_movimentacao_com_estorno_meta_e_transferencia",
      {
        p_movimentacao_id: id,
      }
    );

    if (error?.message) {
      alert(`Erro ao excluir movimentação:\n${error.message}`);
      return;
    }

    await carregarMovimentacoes();
    setSelectedItem(null);
  }

  async function handleSaveTransferencia(data: {
    contaOrigemId: string;
    contaDestinoId: string;
    valor: number;
    data: string;
    descricao: string;
  }) {
    const { error } = await supabase.from("movimentacoes").insert({
      tipo: "transferencia",
      descricao: data.descricao,
      categoria: "transferencia_entre_contas",
      valor: data.valor,
      data: data.data,
      tipo_pagamento: null,
      cartao_id: null,
      parcelas: null,
      primeira_cobranca: null,
      conta_id: data.contaOrigemId,
      conta_destino_id: data.contaDestinoId,
    });

    if (error) {
      throw new Error(error.message);
    }

    setTransferenciaOpen(false);
    await carregarMovimentacoes();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !formData.descricao.trim() ||
      !formData.categoria ||
      !formData.valor ||
      !formData.data
    ) {
      alert("Preencha descrição, categoria, valor e data.");
      return;
    }

    const valorNumerico = Number(formData.valor);

    if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    if (
      formType === "despesa" &&
      formData.tipoPagamento === "credito" &&
      !formData.cartaoId
    ) {
      alert("Selecione o cartão.");
      return;
    }

    if (
      formType === "despesa" &&
      formData.tipoPagamento === "credito" &&
      !formData.parcelas
    ) {
      alert("Informe o número de parcelas.");
      return;
    }

    const primeiraCobrancaFinal =
      formType === "despesa" && formData.tipoPagamento === "credito"
        ? formData.primeiraCobranca || primeiraCobrancaSugerida
        : "";

    if (
      formType === "despesa" &&
      formData.tipoPagamento === "credito" &&
      !primeiraCobrancaFinal
    ) {
      alert("Informe a primeira cobrança.");
      return;
    }

    const payload = {
      tipo: formType,
      descricao: formData.descricao.trim(),
      categoria: formData.categoria,
      valor: valorNumerico,
      data: formData.data,
      tipo_pagamento: formType === "despesa" ? formData.tipoPagamento : null,
      cartao_id:
        formType === "despesa" && formData.tipoPagamento === "credito"
          ? Number(formData.cartaoId)
          : null,
      parcelas:
        formType === "despesa" && formData.tipoPagamento === "credito"
          ? Number(formData.parcelas)
          : null,
      primeira_cobranca:
        formType === "despesa" && formData.tipoPagamento === "credito"
          ? primeiraCobrancaFinal
          : null,
      ...(formData.contaId ? { conta_id: formData.contaId } : { conta_id: null }),
    };

    if (editingId !== null) {
      const { data, error } = await supabase
        .from("movimentacoes")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();

      if (error) {
        alert("Erro ao atualizar movimentação.");
        return;
      }

      setMovimentacoes((prev) =>
        prev.map((item) =>
          item.id === editingId ? mapDbToUi(data as DbMovimentacao) : item
        )
      );

      closeSheet();
      return;
    }

    const { data, error } = await supabase
      .from("movimentacoes")
      .insert(payload)
      .select()
      .single();

    if (error) {
      alert("Erro ao salvar movimentação.");
      return;
    }

    setMovimentacoes((prev) => [
      mapDbToUi(data as DbMovimentacao),
      ...prev,
    ]);
    setActiveTab(formType === "entrada" ? "entradas" : "despesas");
    closeSheet();
  }

  const movimentacoesDoMesVisual = useMemo(() => {
    return movimentacoes.filter(
      (item) => item.data.slice(0, 7) === mesSelecionado
    );
  }, [mesSelecionado, movimentacoes]);

  const movimentacoesDoMesFinanceiro = useMemo(() => {
    return movimentacoes.filter((item) => {
      if (item.tipo === "entrada") {
        return item.data.slice(0, 7) === mesSelecionado;
      }

      if (item.tipoPagamento === "credito") {
        return item.primeiraCobranca === mesSelecionado;
      }

      return item.data.slice(0, 7) === mesSelecionado;
    });
  }, [mesSelecionado, movimentacoes]);

  const totalEntradas = useMemo(
    () =>
      movimentacoesDoMesFinanceiro
        .filter((item) => item.tipo === "entrada")
        .reduce((acc, item) => acc + item.valor, 0),
    [movimentacoesDoMesFinanceiro]
  );

  const despesasAVista = useMemo(
    () =>
      movimentacoesDoMesFinanceiro.filter(
        (item) => item.tipo === "despesa" && item.tipoPagamento !== "credito"
      ),
    [movimentacoesDoMesFinanceiro]
  );

  const despesasNoCredito = useMemo(
    () =>
      movimentacoesDoMesFinanceiro.filter(
        (item) => item.tipo === "despesa" && item.tipoPagamento === "credito"
      ),
    [movimentacoesDoMesFinanceiro]
  );

  const totalSaidasAVista = useMemo(
    () => despesasAVista.reduce((acc, item) => acc + item.valor, 0),
    [despesasAVista]
  );

  const totalLancadoNoCredito = useMemo(
    () => despesasNoCredito.reduce((acc, item) => acc + item.valor, 0),
    [despesasNoCredito]
  );

  const saldo = totalEntradas - totalSaidasAVista;

  const categoriasEntradaDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        movimentacoesDoMesVisual
          .filter((item) => item.tipo === "entrada")
          .map((item) => item.categoria)
      )
    ).sort((a, b) =>
      resolveCategoryLabel(a, todasCategorias).localeCompare(
        resolveCategoryLabel(b, todasCategorias)
      )
    );
  }, [movimentacoesDoMesVisual, todasCategorias]);

  const categoriasDespesaDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        movimentacoesDoMesVisual
          .filter((item) => item.tipo === "despesa")
          .map((item) => item.categoria)
      )
    ).sort((a, b) =>
      resolveCategoryLabel(a, todasCategorias).localeCompare(
        resolveCategoryLabel(b, todasCategorias)
      )
    );
  }, [movimentacoesDoMesVisual, todasCategorias]);

  const listaBase = useMemo(() => {
    let base = movimentacoesDoMesVisual.filter((item) =>
      activeTab === "entradas"
        ? item.tipo === "entrada"
        : item.tipo === "despesa"
    );

    if (activeTab === "entradas" && filtroCategoriaEntrada !== "todas") {
      base = base.filter((item) => item.categoria === filtroCategoriaEntrada);
    }

    if (activeTab === "despesas" && filtroCategoriaDespesa !== "todas") {
      base = base.filter((item) => item.categoria === filtroCategoriaDespesa);
    }

    if (activeTab === "despesas" && filtroPagamentoDespesa !== "todos") {
      base = base.filter(
        (item) => item.tipoPagamento === filtroPagamentoDespesa
      );
    }

    return base;
  }, [
    activeTab,
    filtroCategoriaDespesa,
    filtroCategoriaEntrada,
    filtroPagamentoDespesa,
    movimentacoesDoMesVisual,
  ]);

  const listaFiltrada = useMemo(() => {
    const termo = search.trim().toLowerCase();
    if (!termo) return listaBase;

    return listaBase.filter((item) => {
      const categoriaLabel = resolveCategoryLabel(
        item.categoria,
        todasCategorias
      ).toLowerCase();
      const nomeCartao = item.cartaoId
        ? (cartoesMap.get(item.cartaoId) ?? "").toLowerCase()
        : "";

      return (
        item.descricao.toLowerCase().includes(termo) ||
        categoriaLabel.includes(termo) ||
        nomeCartao.includes(termo)
      );
    });
  }, [cartoesMap, listaBase, search, todasCategorias]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, Movimentacao[]>();

    listaFiltrada.forEach((item) => {
      const chave = item.data;
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave)?.push(item);
    });

    return Array.from(mapa.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [listaFiltrada]);

  const sheetTitle =
    editingId !== null
      ? formType === "entrada"
        ? "Editar entrada"
        : "Editar despesa"
      : formType === "entrada"
        ? "Nova entrada"
        : "Nova despesa";

  const sheetDescription =
    editingId !== null
      ? "Atualize os dados da movimentação."
      : formType === "entrada"
        ? "Preencha os dados para registrar uma nova entrada."
        : "Preencha os dados para registrar uma nova despesa.";

  const filtrosAtivos =
    !!search ||
    filtroCategoriaEntrada !== "todas" ||
    filtroCategoriaDespesa !== "todas" ||
    filtroPagamentoDespesa !== "todos";

  return (
    <>
      <PageShell
        title="Movimentações"
        description="Gerencie entradas e saídas do seu financeiro."
        action={
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => openSheet("entrada")}
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-95"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova entrada
            </button>

            <button
              type="button"
              onClick={() => openSheet("despesa")}
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova despesa
            </button>

            <button
              type="button"
              onClick={() => setTransferenciaOpen(true)}
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Transferência
            </button>

            <button
              type="button"
              onClick={() =>
                openCategorias(
                  activeTab === "entradas" ? "entrada" : "despesa"
                )
              }
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <Tag className="mr-2 h-4 w-4" />
              Gerenciar categorias
            </button>
          </div>
        }
      >
        <SectionCard className="rounded-[30px]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Competência
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Tudo abaixo reflete o mês selecionado.
              </p>
            </div>

            <div className="w-full max-w-xs">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Mês
              </label>
              <input
                type="month"
                value={mesSelecionado}
                onChange={(e) => {
                  setMesSelecionado(e.target.value);
                  limparFiltrosListagem();
                }}
                className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-4 md:grid-cols-4">
          <ResumoCard
            title="Saldo do período"
            value={formatCurrency(saldo)}
            tone="neutral"
          />
          <ResumoCard
            title="Entradas"
            value={formatCurrency(totalEntradas)}
            tone="success"
          />
          <ResumoCard
            title="Saídas à vista"
            value={formatCurrency(totalSaidasAVista)}
            tone="danger"
          />
          <ResumoCard
            title="Lançado no crédito"
            value={formatCurrency(totalLancadoNoCredito)}
            tone="warning"
          />
        </div>

        <SaldoContas
          contas={contasBancarias}
          movimentacoes={movimentacoes}
        />

        <SectionCard className="rounded-[30px]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              O saldo desta tela considera apenas{" "}
              <span className="font-semibold">entradas e saídas à vista</span>.
              Compras no crédito aparecem na data da compra, mas entram no
              financeiro real apenas na{" "}
              <span className="font-semibold">competência da fatura</span>.
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="inline-flex w-fit rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("entradas");
                    setSearch("");
                  }}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === "entradas"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Entradas
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("despesas");
                    setSearch("");
                  }}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === "despesas"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Despesas
                </button>
              </div>

              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar movimentação..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
              <div className="flex items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>

                {activeTab === "entradas" ? (
                  <select
                    value={filtroCategoriaEntrada}
                    onChange={(e) =>
                      setFiltroCategoriaEntrada(e.target.value)
                    }
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                  >
                    <option value="todas">Todas as categorias</option>
                    {categoriasEntradaDisponiveis.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {resolveCategoryLabel(categoria, todasCategorias)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={filtroCategoriaDespesa}
                    onChange={(e) =>
                      setFiltroCategoriaDespesa(e.target.value)
                    }
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                  >
                    <option value="todas">Todas as categorias</option>
                    {categoriasDespesaDisponiveis.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {resolveCategoryLabel(categoria, todasCategorias)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {activeTab === "despesas" ? (
                <select
                  value={filtroPagamentoDespesa}
                  onChange={(e) =>
                    setFiltroPagamentoDespesa(
                      e.target.value as "todos" | PaymentType
                    )
                  }
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                >
                  <option value="todos">Todos os pagamentos</option>
                  <option value="pix_dinheiro">PIX / Dinheiro</option>
                  <option value="debito">Cartão de Débito</option>
                  <option value="credito">Cartão de Crédito</option>
                </select>
              ) : (
                <div />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <div className="text-sm text-slate-600">
                Mês selecionado:{" "}
                <span className="font-semibold text-slate-900">
                  {formatCompetencia(mesSelecionado)}
                </span>
              </div>

              <div className="text-sm text-slate-600">
                {loading ? (
                  "Carregando..."
                ) : (
                  <>
                    Mostrando{" "}
                    <span className="font-semibold text-slate-900">
                      {listaFiltrada.length}
                    </span>{" "}
                    {listaFiltrada.length === 1
                      ? "movimentação"
                      : "movimentações"}
                  </>
                )}
              </div>
            </div>

            {filtrosAtivos && (
              <div className="flex flex-wrap gap-2">
                {search && <FiltroChip label={`Busca: ${search}`} />}
                {activeTab === "entradas" &&
                  filtroCategoriaEntrada !== "todas" && (
                    <FiltroChip
                      label={`Categoria: ${resolveCategoryLabel(filtroCategoriaEntrada, categoriasEntrada)}`}
                    />
                  )}
                {activeTab === "despesas" &&
                  filtroCategoriaDespesa !== "todas" && (
                    <FiltroChip
                      label={`Categoria: ${resolveCategoryLabel(filtroCategoriaDespesa, categoriasDespesa)}`}
                    />
                  )}
                {activeTab === "despesas" &&
                  filtroPagamentoDespesa !== "todos" && (
                    <FiltroChip
                      label={`Pagamento: ${formatTipoPagamento(filtroPagamentoDespesa)}`}
                    />
                  )}

                <button
                  type="button"
                  onClick={limparFiltrosListagem}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Limpar filtros
                </button>
              </div>
            )}

            {loading ? (
              <EmptyStatePremium
                title="Carregando movimentações"
                description="Buscando dados no Supabase."
              />
            ) : grupos.length === 0 ? (
              <EmptyStatePremium
                title={`Nenhuma ${
                  activeTab === "entradas" ? "entrada" : "despesa"
                } encontrada`}
                description="Não há movimentações para o mês selecionado ou para os filtros atuais."
              />
            ) : (
              <div className="space-y-6">
                {grupos.map(([data, itens]) => (
                  <section key={data} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-px w-6 bg-slate-200" />
                        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                          {getDataLabel(data)}
                        </div>
                      </div>

                      <span className="text-xs font-medium text-slate-400">
                        {itens.length} {itens.length === 1 ? "item" : "itens"}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {itens.map((item) =>
                        item.tipo === "entrada" ? (
                          <CardEntradaPremium
                            key={item.id}
                            item={item}
                            categoryOptions={todasCategorias}
                            nomeConta={item.contaId ? contasMap.get(item.contaId) : undefined}
                            onOpen={() => setSelectedItem(item)}
                            onEdit={() => handleEdit(item)}
                            onDelete={() => void handleDelete(item.id)}
                          />
                        ) : (
                          <CardDespesaPremium
                            key={item.id}
                            item={item}
                            nomeCartao={
                              item.cartaoId
                                ? (cartoesMap.get(item.cartaoId) ?? "-")
                                : "-"
                            }
                            categoryOptions={todasCategorias}
                            nomeConta={item.contaId ? contasMap.get(item.contaId) : undefined}
                            onOpen={() => setSelectedItem(item)}
                            onEdit={() => handleEdit(item)}
                            onDelete={() => void handleDelete(item.id)}
                          />
                        )
                      )}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      </PageShell>

      {sheetOpen && (
        <ModalMovimentacao
          sheetTitle={sheetTitle}
          sheetDescription={sheetDescription}
          formType={formType}
          setFormType={setFormType}
          formData={formData}
          setFormData={setFormData}
          categoriasAtuais={categoriasAtuais}
          cartoes={cartoes}
          editingId={editingId}
          primeiraCobrancaSugerida={primeiraCobrancaSugerida}
          onClose={closeSheet}
          onSubmit={handleSubmit}
          onOpenCategorias={openCategorias}
          contasBancarias={contasBancarias}
        />
      )}

      {categoriasOpen && (
        <ModalCategorias
          categoriaTab={categoriaTab}
          setCategoriaTab={setCategoriaTab}
          categoriasGerenciadasAtuais={categoriasGerenciadasAtuais}
          loadingCategorias={loadingCategorias}
          novaCategoriaNome={novaCategoriaNome}
          setNovaCategoriaNome={setNovaCategoriaNome}
          editingCategoriaId={editingCategoriaId}
          editingCategoriaNome={editingCategoriaNome}
          setEditingCategoriaNome={setEditingCategoriaNome}
          onClose={closeCategorias}
          onAddCategoria={handleAddCategoria}
          onStartEditCategoria={startEditCategoria}
          onCancelEditCategoria={cancelEditCategoria}
          onSaveCategoriaEdit={handleSaveCategoriaEdit}
          onDeleteCategoria={handleDeleteCategoria}
        />
      )}

      {selectedItem && (
        <ModalDetalhes
          selectedItem={selectedItem}
          todasCategorias={todasCategorias}
          cartoesMap={cartoesMap}
          onClose={() => setSelectedItem(null)}
          onEdit={() => {
            const item = selectedItem;
            setSelectedItem(null);
            handleEdit(item);
          }}
          onDelete={() => {
            const id = selectedItem.id;
            setSelectedItem(null);
            void handleDelete(id);
          }}
        />
      )}

      {transferenciaOpen && (
        <ModalTransferencia
          contas={contasBancarias}
          onClose={() => setTransferenciaOpen(false)}
          onSave={handleSaveTransferencia}
        />
      )}
    </>
  );
}
