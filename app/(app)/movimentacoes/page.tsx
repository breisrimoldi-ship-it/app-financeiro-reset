"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CreditCard,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/ui/section-card";
import { createClient } from "@/lib/supabase/client";
import {
  getCategoryLabel,
  getCategoryOptions,
} from "@/lib/finance/categories";

type FormType = "entrada" | "despesa";
type TabType = "entradas" | "despesas";
type PaymentType = "pix_dinheiro" | "debito" | "credito";

type Cartao = {
  id: number;
  nome: string;
  fechamentoDia: number;
  vencimentoDia: number;
};

type Movimentacao = {
  id: number;
  created_at?: string;
  tipo: FormType;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  tipoPagamento?: PaymentType | null;
  cartaoId?: number | null;
  parcelas?: number | null;
  primeiraCobranca?: string | null;
  metaId?: string | null;
  metaAporteId?: string | null;
};

type DbMovimentacao = {
  id: number;
  created_at: string;
  tipo: FormType;
  descricao: string;
  categoria: string;
  valor: number | string;
  data: string;
  tipo_pagamento: PaymentType | null;
  cartao_id: number | null;
  parcelas: number | null;
  primeira_cobranca: string | null;
  meta_id: string | null;
  meta_aporte_id: string | null;
};

type DbCartao = {
  id: number;
  nome: string;
  fechamento_dia: number;
  vencimento_dia: number;
};

const supabase = createClient();

function getInitialFormData() {
  return {
    descricao: "",
    categoria: "",
    valor: "",
    data: "",
    tipoPagamento: "pix_dinheiro" as PaymentType,
    cartaoId: "",
    parcelas: "",
    primeiraCobranca: "",
  };
}

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

  const [formData, setFormData] = useState(getInitialFormData());

  const categoriasAtuais = getCategoryOptions(formType);

  const cartoesMap = useMemo(
    () => new Map(cartoes.map((cartao) => [cartao.id, cartao.nome])),
    [cartoes]
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

  const carregarMovimentacoes = useCallback(async () => {
    const { data, error } = await supabase
      .from("movimentacoes")
      .select("*")
      .order("data", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar movimentações:", error);
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
      console.error("Erro ao carregar cartões:", error);
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

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([carregarMovimentacoes(), carregarCartoes()]);
      setLoading(false);
    }

    void init();
  }, [carregarMovimentacoes, carregarCartoes]);

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

  function handleEdit(item: Movimentacao) {
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
    });
    setSheetOpen(true);
  }

async function handleDelete(id: number) {
  const confirmar = window.confirm("Deseja excluir esta movimentação?");
  if (!confirmar) return;

  const { error } = await supabase.rpc(
    "excluir_movimentacao_com_estorno_meta",
    {
      p_movimentacao_id: id,
    }
  );

  if (error?.message) {
    console.error("Erro ao excluir movimentação:", error.message);
    alert(`Erro ao excluir movimentação:\n${error.message}`);
    return;
  }

  await carregarMovimentacoes();
  setSelectedItem(null);
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
    };

    if (editingId !== null) {
      const { data, error } = await supabase
        .from("movimentacoes")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar movimentação:", error);
        alert("Erro ao atualizar movimentação.");
        return;
      }

      setMovimentacoes((prev) =>
        prev.map((item) => (item.id === editingId ? mapDbToUi(data) : item))
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
      console.error("Erro ao salvar movimentação:", error);
      alert("Erro ao salvar movimentação.");
      return;
    }

    setMovimentacoes((prev) => [mapDbToUi(data), ...prev]);
    setActiveTab(formType === "entrada" ? "entradas" : "despesas");
    closeSheet();
  }

  const movimentacoesDoMesVisual = useMemo(() => {
    return movimentacoes.filter((item) => item.data.slice(0, 7) === mesSelecionado);
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
    ).sort((a, b) => getCategoryLabel(a).localeCompare(getCategoryLabel(b)));
  }, [movimentacoesDoMesVisual]);

  const categoriasDespesaDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        movimentacoesDoMesVisual
          .filter((item) => item.tipo === "despesa")
          .map((item) => item.categoria)
      )
    ).sort((a, b) => getCategoryLabel(a).localeCompare(getCategoryLabel(b)));
  }, [movimentacoesDoMesVisual]);

  const listaBase = useMemo(() => {
    let base = movimentacoesDoMesVisual.filter((item) =>
      activeTab === "entradas" ? item.tipo === "entrada" : item.tipo === "despesa"
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
      const categoriaLabel = getCategoryLabel(item.categoria).toLowerCase();
      const nomeCartao = item.cartaoId
        ? (cartoesMap.get(item.cartaoId) ?? "").toLowerCase()
        : "";

      return (
        item.descricao.toLowerCase().includes(termo) ||
        categoriaLabel.includes(termo) ||
        nomeCartao.includes(termo)
      );
    });
  }, [cartoesMap, listaBase, search]);

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
                    onChange={(e) => setFiltroCategoriaEntrada(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                  >
                    <option value="todas">Todas as categorias</option>
                    {categoriasEntradaDisponiveis.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {getCategoryLabel(categoria)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={filtroCategoriaDespesa}
                    onChange={(e) => setFiltroCategoriaDespesa(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                  >
                    <option value="todas">Todas as categorias</option>
                    {categoriasDespesaDisponiveis.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {getCategoryLabel(categoria)}
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
                    {listaFiltrada.length === 1 ? "movimentação" : "movimentações"}
                  </>
                )}
              </div>
            </div>

            {filtrosAtivos && (
              <div className="flex flex-wrap gap-2">
                {search && <FiltroChip label={`Busca: ${search}`} />}
                {activeTab === "entradas" && filtroCategoriaEntrada !== "todas" && (
                  <FiltroChip
                    label={`Categoria: ${getCategoryLabel(filtroCategoriaEntrada)}`}
                  />
                )}
                {activeTab === "despesas" && filtroCategoriaDespesa !== "todas" && (
                  <FiltroChip
                    label={`Categoria: ${getCategoryLabel(filtroCategoriaDespesa)}`}
                  />
                )}
                {activeTab === "despesas" && filtroPagamentoDespesa !== "todos" && (
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
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px]"
            onClick={closeSheet}
          />

          <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {sheetTitle}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {sheetDescription}
                </p>
              </div>

              <button
                type="button"
                onClick={closeSheet}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-1 flex-col overflow-y-auto"
            >
              <div className="space-y-6 px-6 py-6">
                <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Dados principais
                  </h3>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">
                      Tipo
                    </label>

                    <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setFormType("entrada")}
                        className={
                          formType === "entrada"
                            ? "flex-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm"
                            : "flex-1 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                        }
                      >
                        Entrada
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormType("despesa")}
                        className={
                          formType === "despesa"
                            ? "flex-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm"
                            : "flex-1 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                        }
                      >
                        Despesa
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">
                      Descrição
                    </label>
                    <input
                      type="text"
                      placeholder="Ex.: Corridas Uber, Mercado, Salário..."
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          descricao: e.target.value,
                        }))
                      }
                      className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-700">
                        Valor
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={formData.valor}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            valor: e.target.value,
                          }))
                        }
                        className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-700">
                        Data
                      </label>
                      <input
                        type="date"
                        value={formData.data}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            data: e.target.value,
                          }))
                        }
                        className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">
                      Categoria
                    </label>
                    <select
                      value={formData.categoria}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          categoria: e.target.value,
                        }))
                      }
                      className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                    >
                      <option value="">Selecione</option>
                      {categoriasAtuais.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formType === "despesa" && (
                  <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Pagamento
                    </h3>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-700">
                        Tipo de pagamento
                      </label>
                      <select
                        value={formData.tipoPagamento}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            tipoPagamento: e.target.value as PaymentType,
                            cartaoId:
                              e.target.value === "credito" ? prev.cartaoId : "",
                            parcelas:
                              e.target.value === "credito" ? prev.parcelas : "",
                            primeiraCobranca:
                              e.target.value === "credito"
                                ? prev.primeiraCobranca
                                : "",
                          }))
                        }
                        className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                      >
                        <option value="pix_dinheiro">PIX / Dinheiro</option>
                        <option value="debito">Cartão de Débito</option>
                        <option value="credito">Cartão de Crédito</option>
                      </select>
                    </div>

                    {formData.tipoPagamento === "credito" && (
                      <>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium text-slate-700">
                            Cartão
                          </label>
                          <select
                            value={formData.cartaoId}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                cartaoId: e.target.value,
                              }))
                            }
                            className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                          >
                            <option value="">Selecione</option>
                            {cartoes.map((cartao) => (
                              <option key={cartao.id} value={cartao.id}>
                                {cartao.nome}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">
                              Parcelas
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={formData.parcelas}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  parcelas: e.target.value,
                                }))
                              }
                              className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                            />
                          </div>

                          <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">
                              Primeira cobrança
                            </label>
                            <input
                              type="month"
                              value={
                                formData.primeiraCobranca || primeiraCobrancaSugerida
                              }
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  primeiraCobranca: e.target.value,
                                }))
                              }
                              className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                            />
                          </div>
                        </div>

                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          Essa despesa vai aparecer no seu histórico na data da compra,
                          mas entra na{" "}
                          <span className="font-semibold">
                            fatura{" "}
                            {formatCompetencia(
                              formData.primeiraCobranca || primeiraCobrancaSugerida
                            )}
                          </span>
                          .
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-auto flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeSheet}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-95"
                >
                  {editingId !== null ? "Salvar alterações" : "Salvar"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

      {selectedItem && (
        <>
          <div
            className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => setSelectedItem(null)}
          />

          <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-4xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Detalhes da movimentação
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">
                    {selectedItem.descricao}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-6 px-6 py-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <DetalheItem
                    label="Tipo"
                    value={selectedItem.tipo === "entrada" ? "Entrada" : "Despesa"}
                  />
                  <DetalheItem
                    label="Valor"
                    value={formatCurrency(selectedItem.valor)}
                    destaque={
                      selectedItem.tipo === "entrada"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }
                  />
                  <DetalheItem label="Data" value={formatDate(selectedItem.data)} />
                  <DetalheItem
                    label="Categoria"
                    value={getCategoryLabel(selectedItem.categoria)}
                  />
                </div>

                {selectedItem.tipo === "despesa" && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Pagamento
                    </h4>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <DetalheItem
                        label="Tipo de pagamento"
                        value={formatTipoPagamento(
                          selectedItem.tipoPagamento ?? "pix_dinheiro"
                        )}
                      />

                      {selectedItem.tipoPagamento === "credito" && (
                        <>
                          <DetalheItem
                            label="Cartão"
                            value={
                              selectedItem.cartaoId
                                ? (cartoesMap.get(selectedItem.cartaoId) ?? "-")
                                : "-"
                            }
                          />
                          <DetalheItem
                            label="Parcelas"
                            value={
                              selectedItem.parcelas
                                ? `${selectedItem.parcelas}x`
                                : "-"
                            }
                          />
                          <DetalheItem
                            label="Competência da fatura"
                            value={formatCompetencia(
                              selectedItem.primeiraCobranca ?? ""
                            )}
                          />
                          <DetalheItem
                            label="Valor da parcela"
                            value={
                              selectedItem.parcelas
                                ? formatCurrency(
                                    selectedItem.valor / selectedItem.parcelas
                                  )
                                : "-"
                            }
                          />
                        </>
                      )}
                    </div>

                    {selectedItem.tipoPagamento === "credito" && (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Essa compra aparece na data em que foi feita, mas afeta o
                        financeiro na{" "}
                        <span className="font-semibold">
                          fatura {formatCompetencia(selectedItem.primeiraCobranca ?? "")}
                        </span>
                        .
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Fechar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const item = selectedItem;
                    setSelectedItem(null);
                    handleEdit(item);
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Editar
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const id = selectedItem.id;
                    setSelectedItem(null);
                    await handleDelete(id);
                  }}
                  className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function mapDbToUi(item: DbMovimentacao): Movimentacao {
  return {
    id: item.id,
    created_at: item.created_at,
    tipo: item.tipo,
    descricao: item.descricao,
    categoria: item.categoria,
    valor: Number(item.valor),
    data: item.data,
    tipoPagamento: item.tipo_pagamento,
    cartaoId: item.cartao_id,
    parcelas: item.parcelas,
    primeiraCobranca: item.primeira_cobranca,
    metaId: item.meta_id,
    metaAporteId: item.meta_aporte_id,
  };
}

function FiltroChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
      {label}
    </span>
  );
}

function DetalheItem({
  label,
  value,
  destaque,
}: {
  label: string;
  value: string;
  destaque?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className={`mt-2 text-sm font-semibold text-slate-900 ${destaque ?? ""}`}>
        {value}
      </p>
    </div>
  );
}

function ResumoCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "neutral" | "success" | "danger" | "warning";
}) {
  const toneMap = {
    neutral: {
      wrapper: "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
      text: "text-slate-900",
      icon: "text-slate-700",
    },
    success: {
      wrapper: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white",
      text: "text-emerald-600",
      icon: "text-emerald-600",
    },
    danger: {
      wrapper: "border-rose-100 bg-gradient-to-br from-rose-50 to-white",
      text: "text-rose-500",
      icon: "text-rose-500",
    },
    warning: {
      wrapper: "border-amber-100 bg-gradient-to-br from-amber-50 to-white",
      text: "text-amber-600",
      icon: "text-amber-600",
    },
  };

  const current = toneMap[tone];

  return (
    <div
      className={`overflow-hidden rounded-[28px] border p-6 shadow-sm ${current.wrapper}`}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <Wallet className={`h-4 w-4 ${current.icon}`} />
        {title}
      </div>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${current.text}`}>
        {value}
      </p>
    </div>
  );
}

function AcaoItem({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <details className="relative">
      <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
        <MoreHorizontal className="h-4 w-4" />
      </summary>

      <div className="absolute right-0 top-11 z-10 w-40 rounded-2xl border border-slate-200 bg-white p-1 shadow-xl">
        <button
          type="button"
          onClick={onEdit}
          className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </button>
      </div>
    </details>
  );
}

function CardEntradaPremium({
  item,
  onEdit,
  onDelete,
  onOpen,
}: {
  item: Movimentacao;
  onEdit: () => void;
  onDelete: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group w-full cursor-pointer rounded-[28px] border border-slate-200/80 bg-white px-5 py-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md md:px-6"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <ArrowUpRight className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-slate-900">
                {item.descricao}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(item.data)}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                  <Tag className="h-3.5 w-3.5" />
                  {getCategoryLabel(item.categoria)}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-left sm:text-right">
                <p className="text-xl font-semibold tracking-tight text-emerald-600">
                  + {formatCurrency(item.valor)}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  recebimento
                </p>
              </div>

              <div
                className="opacity-100 transition md:opacity-0 md:group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <AcaoItem onEdit={onEdit} onDelete={onDelete} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardDespesaPremium({
  item,
  nomeCartao,
  onEdit,
  onDelete,
  onOpen,
}: {
  item: Movimentacao;
  nomeCartao: string;
  onEdit: () => void;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const valorParcela =
    item.tipoPagamento === "credito" && item.parcelas
      ? item.valor / item.parcelas
      : null;

  const isCredito = item.tipoPagamento === "credito";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group w-full cursor-pointer rounded-[28px] border border-slate-200/80 bg-white px-5 py-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md md:px-6"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
          <ArrowDownLeft className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-slate-900">
                {item.descricao}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(item.data)}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                  <Tag className="h-3.5 w-3.5" />
                  {getCategoryLabel(item.categoria)}
                </span>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                  {formatTipoPagamento(item.tipoPagamento ?? "pix_dinheiro")}
                </span>

                {isCredito && item.primeiraCobranca && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                    Fatura {formatCompetencia(item.primeiraCobranca)}
                  </span>
                )}
              </div>

              {isCredito && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    {nomeCartao}
                  </span>

                  {item.parcelas && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                      {item.parcelas}x
                    </span>
                  )}

                  {valorParcela && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">
                      Parcela {formatCurrency(valorParcela)}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-start gap-3">
              <div className="text-left sm:text-right">
                <p className="text-xl font-semibold tracking-tight text-rose-600">
                  - {formatCurrency(item.valor)}
                </p>

                {isCredito ? (
                  <p className="mt-1 text-[11px] text-slate-400">
                    não afeta o saldo agora
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    saída
                  </p>
                )}
              </div>

              <div
                className="opacity-100 transition md:opacity-0 md:group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <AcaoItem onEdit={onEdit} onDelete={onDelete} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyStatePremium({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <Wallet className="h-6 w-6 text-slate-400" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function getMesAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

function calcularPrimeiraCobranca(
  dataCompra: string,
  cartaoId: number,
  cartoes: Cartao[]
) {
  const cartao = cartoes.find((item) => item.id === cartaoId);
  if (!cartao || !dataCompra) return "";

  const [ano, mes, dia] = dataCompra.split("-").map(Number);
  if (!ano || !mes || !dia) return "";

  let anoCobranca = ano;
  let mesCobranca = mes;

  if (dia > cartao.fechamentoDia) {
    if (mes === 12) {
      anoCobranca = ano + 1;
      mesCobranca = 1;
    } else {
      mesCobranca = mes + 1;
    }
  }

  return `${anoCobranca}-${String(mesCobranca).padStart(2, "0")}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateString: string) {
  if (!dateString) return "--/--/----";
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

function formatCompetencia(value: string) {
  if (!value) return "-";
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  return `${month}/${year}`;
}

function formatTipoPagamento(tipo: PaymentType) {
  if (tipo === "credito") return "Cartão de Crédito";
  if (tipo === "debito") return "Cartão de Débito";
  return "PIX / Dinheiro";
}

function getDataLabel(data: string) {
  const hoje = new Date();
  const hojeFormatado = hoje.toISOString().slice(0, 10);

  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  const ontemFormatado = ontem.toISOString().slice(0, 10);

  if (data === hojeFormatado) return "Hoje";
  if (data === ontemFormatado) return "Ontem";

  return formatDate(data);
}