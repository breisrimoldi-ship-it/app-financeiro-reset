"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  CreditCard,
  Layers3,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/ui/section-card";

type AbaCartoes = "visao" | "faturas" | "cartoes" | "ajustes";

type Cartao = {
  id: number;
  nome: string;
  limite: number | string | null;
  fechamento_dia: number;
  vencimento_dia: number;
  created_at?: string;
};

type DespesaCartao = {
  id: number;
  descricao?: string | null;
  valor: number;
  tipo: string;
  tipo_pagamento: string;
  categoria?: string | null;
  parcelas: number | null;
  primeira_cobranca: string | null;
  cartao_id: number | null;
  data: string;
};

type PagamentoFatura = {
  id: number;
  cartao_id: number;
  mes_referencia: string;
  valor_pago: number;
  data_pagamento: string;
  status: string;
};

type ParcelaProjetada = {
  despesaId: number;
  descricao: string;
  valor: number;
  parcelaAtual: number;
  totalParcelas: number;
  mes: string;
};

type LinhaSaldoInicial = {
  mes: string;
  valor: string;
};

const supabase = createClient();

export default function CartoesPage() {
  const [abaAtiva, setAbaAtiva] = useState<AbaCartoes>("visao");

  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [despesasCartao, setDespesasCartao] = useState<DespesaCartao[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoFatura[]>([]);

  const [loading, setLoading] = useState(true);
  const [pagandoKey, setPagandoKey] = useState<string | null>(null);

  const [sheetCartaoAberto, setSheetCartaoAberto] = useState(false);
  const [idEmEdicao, setIdEmEdicao] = useState<number | null>(null);

  const [nome, setNome] = useState("");
  const [limite, setLimite] = useState("");
  const [fechamentoDia, setFechamentoDia] = useState("");
  const [vencimentoDia, setVencimentoDia] = useState("");

  const [cartaoAberto, setCartaoAberto] = useState<number | null>(null);
  const [mesAberto, setMesAberto] = useState<string | null>(null);

  const [cartaoSaldoInicialId, setCartaoSaldoInicialId] = useState("");
  const [mesInicialSaldo, setMesInicialSaldo] = useState(getMesAtual());
  const [quantidadeMesesSaldo, setQuantidadeMesesSaldo] = useState("1");
  const [linhasSaldoInicial, setLinhasSaldoInicial] = useState<LinhaSaldoInicial[]>([
    { mes: getMesAtual(), valor: "" },
  ]);
  const [salvandoSaldoInicial, setSalvandoSaldoInicial] = useState(false);

  const carregarDados = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);

    const [
      { data: cartoesData, error: cartoesError },
      { data: movimentacoesData, error: movimentacoesError },
      { data: pagamentosData, error: pagamentosError },
    ] = await Promise.all([
      supabase.from("cartoes").select("*").order("nome", { ascending: true }),
      supabase
        .from("movimentacoes")
        .select(
          "id, descricao, valor, tipo, tipo_pagamento, categoria, parcelas, primeira_cobranca, cartao_id, data"
        )
        .eq("tipo", "despesa")
        .eq("tipo_pagamento", "credito"),
      supabase
        .from("faturas_pagamento")
        .select("id, cartao_id, mes_referencia, valor_pago, data_pagamento, status"),
    ]);

    if (cartoesError) {
      console.error("Erro ao buscar cartões:", cartoesError);
      alert("Erro ao carregar cartões.");
      if (showLoading) setLoading(false);
      return;
    }

    if (movimentacoesError) {
      console.error("Erro ao buscar movimentações de cartão:", movimentacoesError);
      alert("Erro ao carregar despesas dos cartões.");
      if (showLoading) setLoading(false);
      return;
    }

    if (pagamentosError) {
      console.error("Erro ao buscar pagamentos:", pagamentosError);
      alert("Erro ao carregar pagamentos das faturas.");
      if (showLoading) setLoading(false);
      return;
    }

    setCartoes(
  ((cartoesData as Cartao[]) ?? []).map((item) => ({
    ...item,
    limite: Number(item.limite ?? 0),
    fechamento_dia: Number(item.fechamento_dia ?? 0),
    vencimento_dia: Number(item.vencimento_dia ?? 0),
  }))
);
    setDespesasCartao(
      ((movimentacoesData as DespesaCartao[]) ?? []).map((item) => ({
        ...item,
        valor: Number(item.valor),
      }))
    );
    setPagamentos(
      ((pagamentosData as PagamentoFatura[]) ?? []).map((item) => ({
        ...item,
        valor_pago: Number(item.valor_pago),
      }))
    );

    if (showLoading) setLoading(false);
  }, []);

  useEffect(() => {
    void carregarDados(true);
  }, [carregarDados]);

  function limparFormularioCartao() {
    setNome("");
    setLimite("");
    setFechamentoDia("");
    setVencimentoDia("");
    setIdEmEdicao(null);
  }

  function abrirNovoCartao() {
    limparFormularioCartao();
    setSheetCartaoAberto(true);
  }

  function fecharSheetCartao() {
    setSheetCartaoAberto(false);
    limparFormularioCartao();
  }

  function handleEditarCartao(cartao: Cartao) {
  setIdEmEdicao(cartao.id);
  setNome(cartao.nome ?? "");
  setLimite(
    cartao.limite === null || Number.isNaN(Number(cartao.limite ?? 0))
      ? ""
      : String(cartao.limite)
  );
  setFechamentoDia(
    cartao.fechamento_dia === null || Number.isNaN(Number(cartao.fechamento_dia))
      ? ""
      : String(cartao.fechamento_dia)
  );
  setVencimentoDia(
    cartao.vencimento_dia === null || Number.isNaN(Number(cartao.vencimento_dia))
      ? ""
      : String(cartao.vencimento_dia)
  );
  setSheetCartaoAberto(true);
}

  async function handleExcluirCartao(id: number) {
    const confirmar = window.confirm("Deseja excluir este cartão?");
    if (!confirmar) return;

    const { error } = await supabase.from("cartoes").delete().eq("id", id);

    if (error) {
  console.error("Erro ao atualizar cartão:", {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
    full: error,
  });

  alert(
    `Erro ao atualizar cartão:
${error.message ?? "sem mensagem"}
${error.details ? `\nDetails: ${error.details}` : ""}
${error.hint ? `\nHint: ${error.hint}` : ""}`
  );
  return;
}

    await carregarDados(false);
  }

  async function handleSalvarCartao(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!nome.trim() || !limite || !fechamentoDia || !vencimentoDia) {
      alert("Preencha nome, limite, fechamento e vencimento.");
      return;
    }

    const limiteNumero = Number(limite);
    const fechamentoNumero = Number(fechamentoDia);
    const vencimentoNumero = Number(vencimentoDia);

    if (Number.isNaN(limiteNumero) || limiteNumero <= 0) {
      alert("Informe um limite válido.");
      return;
    }

    if (
      Number.isNaN(fechamentoNumero) ||
      fechamentoNumero < 1 ||
      fechamentoNumero > 31
    ) {
      alert("O dia de fechamento deve estar entre 1 e 31.");
      return;
    }

    if (
      Number.isNaN(vencimentoNumero) ||
      vencimentoNumero < 1 ||
      vencimentoNumero > 31
    ) {
      alert("O dia de vencimento deve estar entre 1 e 31.");
      return;
    }

    const payload = {
      nome: nome.trim(),
      limite: limiteNumero,
      fechamento_dia: fechamentoNumero,
      vencimento_dia: vencimentoNumero,
    };

    if (idEmEdicao !== null) {
      const { error } = await supabase
        .from("cartoes")
        .update(payload)
        .eq("id", idEmEdicao);

      if (error) {
  console.error("Erro ao salvar cartão:", {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
    full: error,
  });

  alert(
    `Erro ao salvar cartão:
${error.message ?? "sem mensagem"}
${error.details ? `\nDetails: ${error.details}` : ""}
${error.hint ? `\nHint: ${error.hint}` : ""}`
  );
  return;
}

      fecharSheetCartao();
      await carregarDados(false);
      return;
    }

    const { error } = await supabase.from("cartoes").insert([payload]);

    if (error) {
      console.error("Erro ao salvar cartão:", error);
      alert("Erro ao salvar cartão.");
      return;
    }

    fecharSheetCartao();
    await carregarDados(false);
  }

  async function pagarFatura(
    cartaoId: number,
    mesReferencia: string,
    valorTotal: number
  ) {
    const key = `${cartaoId}-${mesReferencia}`;
    setPagandoKey(key);

    try {
      const pagamentoExistente = pagamentos.find(
        (item) =>
          item.cartao_id === cartaoId && item.mes_referencia === mesReferencia
      );

      if (pagamentoExistente) {
        const { data, error } = await supabase
          .from("faturas_pagamento")
          .update({
            valor_pago: valorTotal,
            data_pagamento: getDataHoje(),
            status: "paga",
          })
          .eq("id", pagamentoExistente.id)
          .select()
          .single();

        if (error) {
          console.error("Erro ao atualizar pagamento:", error);
          alert("Erro ao atualizar pagamento da fatura.");
          return;
        }

        setPagamentos((prev) =>
          prev.map((item) =>
            item.id === pagamentoExistente.id
              ? { ...(data as PagamentoFatura), valor_pago: Number(data.valor_pago) }
              : item
          )
        );

        return;
      }

      const { data, error } = await supabase
        .from("faturas_pagamento")
        .insert({
          cartao_id: cartaoId,
          mes_referencia: mesReferencia,
          valor_pago: valorTotal,
          data_pagamento: getDataHoje(),
          status: "paga",
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao registrar pagamento:", error);
        alert("Erro ao registrar pagamento da fatura.");
        return;
      }

      setPagamentos((prev) => [
        ...prev,
        { ...(data as PagamentoFatura), valor_pago: Number(data.valor_pago) },
      ]);
    } finally {
      setPagandoKey(null);
    }
  }

  async function desfazerPagamento(cartaoId: number, mesReferencia: string) {
    const key = `${cartaoId}-${mesReferencia}`;
    setPagandoKey(key);

    try {
      const pagamentoExistente = pagamentos.find(
        (item) =>
          item.cartao_id === cartaoId && item.mes_referencia === mesReferencia
      );

      if (!pagamentoExistente) return;

      const { data, error } = await supabase
        .from("faturas_pagamento")
        .update({
          status: "aberta",
        })
        .eq("id", pagamentoExistente.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao desfazer pagamento:", error);
        alert("Erro ao desfazer pagamento da fatura.");
        return;
      }

      setPagamentos((prev) =>
        prev.map((item) =>
          item.id === pagamentoExistente.id
            ? { ...(data as PagamentoFatura), valor_pago: Number(data.valor_pago) }
            : item
        )
      );
    } finally {
      setPagandoKey(null);
    }
  }

  function gerarLinhasSaldoInicial() {
    if (!mesInicialSaldo || !quantidadeMesesSaldo) {
      alert("Preencha o mês inicial e a quantidade de meses.");
      return;
    }

    const quantidade = Number(quantidadeMesesSaldo);

    if (Number.isNaN(quantidade) || quantidade < 1) {
      alert("A quantidade de meses deve ser pelo menos 1.");
      return;
    }

    const linhas: LinhaSaldoInicial[] = [];

    for (let i = 0; i < quantidade; i++) {
      linhas.push({
        mes: adicionarMeses(mesInicialSaldo, i),
        valor: "",
      });
    }

    setLinhasSaldoInicial(linhas);
  }

  function atualizarValorLinhaSaldo(index: number, valor: string) {
    setLinhasSaldoInicial((prev) =>
      prev.map((linha, i) => (i === index ? { ...linha, valor } : linha))
    );
  }

  async function salvarSaldoInicial() {
    if (!cartaoSaldoInicialId) {
      alert("Selecione um cartão.");
      return;
    }

    const linhasValidas = linhasSaldoInicial.filter(
      (linha) => Number(linha.valor) > 0
    );

    if (linhasValidas.length === 0) {
      alert("Informe pelo menos um valor maior que zero.");
      return;
    }

    setSalvandoSaldoInicial(true);

    try {
      const registros = linhasValidas.map((linha) => ({
        tipo: "despesa",
        descricao: `Saldo inicial - ${linha.mes}`,
        valor: Number(linha.valor),
        tipo_pagamento: "credito",
        categoria: "Cartão - Saldo inicial",
        parcelas: 1,
        primeira_cobranca: linha.mes,
        cartao_id: Number(cartaoSaldoInicialId),
        data: `${linha.mes}-01`,
      }));

      const { error } = await supabase.from("movimentacoes").insert(registros);

      if (error) {
        console.error("Erro ao salvar saldo inicial:", error);
        alert("Erro ao salvar saldo inicial.");
        return;
      }

      setCartaoSaldoInicialId("");
      setMesInicialSaldo(getMesAtual());
      setQuantidadeMesesSaldo("1");
      setLinhasSaldoInicial([{ mes: getMesAtual(), valor: "" }]);

      await carregarDados(false);
    } finally {
      setSalvandoSaldoInicial(false);
    }
  }

  const totalLimites = useMemo(
    () => cartoes.reduce((acc, cartao) => acc + Number(cartao.limite || 0), 0),
    [cartoes]
  );

  const mediaLimite = cartoes.length > 0 ? totalLimites / cartoes.length : 0;

  const resumosCartoes = useMemo(() => {
    return cartoes.map((cartao) => {
      const despesasDoCartao = despesasCartao.filter(
        (despesa) =>
          despesa.tipo_pagamento === "credito" && despesa.cartao_id === cartao.id
      );

      const totalLancado = despesasDoCartao.reduce(
        (acc, despesa) => acc + Number(despesa.valor),
        0
      );

      const quantidadeDespesas = despesasDoCartao.length;

      const totalParceladoFuturo = despesasDoCartao
        .filter((despesa) => (despesa.parcelas ?? 1) > 1)
        .reduce((acc, despesa) => acc + Number(despesa.valor), 0);

      const limiteNumero = Number(cartao.limite ?? 0);
      const limiteDisponivel = limiteNumero - totalLancado;
      const percentualUso =
        limiteNumero > 0 ? (totalLancado / limiteNumero) * 100 : 0;

      return {
        id: cartao.id,
        nome: cartao.nome,
        limite: limiteNumero,
        totalLancado,
        limiteDisponivel,
        percentualUso,
        quantidadeDespesas,
        totalParceladoFuturo,
      };
    });
  }, [cartoes, despesasCartao]);

  const totalLancadoGeral = resumosCartoes.reduce(
    (acc, item) => acc + item.totalLancado,
    0
  );

  const totalParceladoFuturoGeral = resumosCartoes.reduce(
    (acc, item) => acc + item.totalParceladoFuturo,
    0
  );

  const totalDespesasCartao = resumosCartoes.reduce(
    (acc, item) => acc + item.quantidadeDespesas,
    0
  );

  const totalSaldoInicial = linhasSaldoInicial.reduce(
    (acc, item) => acc + Number(item.valor || 0),
    0
  );

  const mesAtual = getMesAtual();

  const dadosFaturas = useMemo(() => {
    return cartoes.map((cartao) => {
      const despesasDoCartao = despesasCartao.filter(
        (item) =>
          item.tipo_pagamento === "credito" && item.cartao_id === cartao.id
      );

      const parcelasProjetadas: ParcelaProjetada[] = [];

      despesasDoCartao.forEach((despesa) => {
        if (!despesa.primeira_cobranca) return;

        const totalParcelas = Math.max(despesa.parcelas ?? 1, 1);
        const valorParcela = Number(despesa.valor) / totalParcelas;

        for (let i = 0; i < totalParcelas; i++) {
          parcelasProjetadas.push({
            despesaId: despesa.id,
            descricao: despesa.descricao || "Despesa no cartão",
            valor: valorParcela,
            parcelaAtual: i + 1,
            totalParcelas,
            mes: adicionarMeses(despesa.primeira_cobranca, i),
          });
        }
      });

      const porMes: Record<string, ParcelaProjetada[]> = {};

      parcelasProjetadas.forEach((parcela) => {
        if (!porMes[parcela.mes]) porMes[parcela.mes] = [];
        porMes[parcela.mes].push(parcela);
      });

      const meses = Object.entries(porMes)
        .map(([mes, itens]) => {
          const pagamento = pagamentos.find(
            (item) => item.cartao_id === cartao.id && item.mes_referencia === mes
          );

          return {
            mes,
            total: itens.reduce((acc, item) => acc + item.valor, 0),
            itens,
            vencimento: formatarVencimento(mes, cartao.vencimento_dia),
            status: pagamento?.status ?? "aberta",
            pagamento: pagamento ?? null,
          };
        })
        .sort((a, b) => a.mes.localeCompare(b.mes));

      const totalCartao = meses.reduce((acc, item) => acc + item.total, 0);

      const competenciaProxima = getProximaCompetencia(cartao.vencimento_dia);

      const proximaFatura =
        meses.find((item) => item.mes === competenciaProxima) ||
        meses.find((item) => item.mes > competenciaProxima) ||
        null;

      const faturaMesAtual = meses.find((item) => item.mes === mesAtual) || null;

      const totalUsadoAtual = despesasDoCartao.reduce(
        (acc, item) => acc + Number(item.valor),
        0
      );

      const percentualUso =
        Number(cartao.limite) > 0
          ? (totalUsadoAtual / Number(cartao.limite ?? 0)) * 100
          : 0;

      const limiteDisponivel = Number(cartao.limite ?? 0) - totalUsadoAtual;
      const estourado = totalUsadoAtual > Number(cartao.limite ?? 0);

      return {
        cartao,
        meses,
        totalCartao,
        proximaFatura,
        faturaMesAtual,
        totalUsadoAtual,
        limiteDisponivel,
        percentualUso,
        estourado,
        competenciaProxima,
      };
    });
  }, [cartoes, despesasCartao, pagamentos, mesAtual]);

  return (
    <>
      <PageShell
        title="Cartões"
        description="Controle cartões, faturas, limites e ajustes em uma única tela."
        action={
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={abrirNovoCartao}
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-95"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo cartão
            </button>

            <button
              type="button"
              onClick={() => setAbaAtiva("ajustes")}
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Ajustes
            </button>
          </div>
        }
      >
        <SectionCard className="rounded-[30px]">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Gestão unificada de cartões
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Acompanhe visão geral, faturas, cartões cadastrados e saldo inicial.
              </p>
            </div>

            <div className="inline-flex w-fit flex-wrap rounded-2xl bg-slate-100 p-1">
              <AbaButton
                active={abaAtiva === "visao"}
                onClick={() => setAbaAtiva("visao")}
                icon={<BarChart3 className="h-4 w-4" />}
                label="Visão geral"
              />
              <AbaButton
                active={abaAtiva === "faturas"}
                onClick={() => setAbaAtiva("faturas")}
                icon={<CalendarDays className="h-4 w-4" />}
                label="Faturas"
              />
              <AbaButton
                active={abaAtiva === "cartoes"}
                onClick={() => setAbaAtiva("cartoes")}
                icon={<CreditCard className="h-4 w-4" />}
                label="Cartões"
              />
              <AbaButton
                active={abaAtiva === "ajustes"}
                onClick={() => setAbaAtiva("ajustes")}
                icon={<Settings2 className="h-4 w-4" />}
                label="Ajustes"
              />
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ResumoCard
            title="Cartões cadastrados"
            value={String(cartoes.length)}
            icon={<CreditCard className="h-5 w-5" />}
          />
          <ResumoCard
            title="Limite total"
            value={moeda(totalLimites)}
            icon={<CircleDollarSign className="h-5 w-5" />}
          />
          <ResumoCard
            title="Total lançado"
            value={moeda(totalLancadoGeral)}
            icon={<Layers3 className="h-5 w-5" />}
          />
          <ResumoCard
            title="Parcelado futuro"
            value={moeda(totalParceladoFuturoGeral)}
            icon={<WalletCards className="h-5 w-5" />}
          />
        </div>

        {abaAtiva === "visao" && (
          <div className="space-y-6">
            <SectionCard className="rounded-[30px]">
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Resumo geral
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Visão consolidada dos cartões cadastrados e do total já comprometido.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                  <MiniResumo
                    label="Despesas no cartão"
                    value={String(totalDespesasCartao)}
                  />
                  <MiniResumo label="Média de limite" value={moeda(mediaLimite)} />
                  <MiniResumo label="Total lançado" value={moeda(totalLancadoGeral)} />
                  <MiniResumo
                    label="Parcelado futuro"
                    value={moeda(totalParceladoFuturoGeral)}
                  />
                </div>
              </div>
            </SectionCard>

            <div className="grid gap-5 xl:grid-cols-2">
              {loading ? (
                <EmptyCard text="Carregando visão dos cartões..." />
              ) : resumosCartoes.length === 0 ? (
                <EmptyCard text="Nenhum cartão cadastrado ainda." />
              ) : (
                resumosCartoes.map((cartaoResumo) => {
                  const percentualUso = cartaoResumo.percentualUso;
                  const estourado = cartaoResumo.limiteDisponivel < 0;
                  const cartao = cartoes.find((item) => item.id === cartaoResumo.id);

                  return (
                    <div
                      key={cartaoResumo.id}
                      className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {cartaoResumo.nome}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Acompanhe o uso do limite e o total comprometido.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => cartao && handleEditarCartao(cartao)}
                          className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </button>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-2">
                        <MiniResumoBox
                          label="Limite total"
                          value={moeda(cartaoResumo.limite)}
                        />
                        <MiniResumoBox
                          label="Total lançado"
                          value={moeda(cartaoResumo.totalLancado)}
                        />
                        <MiniResumoBox
                          label="Limite disponível"
                          value={moeda(cartaoResumo.limiteDisponivel)}
                          valueClassName={
                            cartaoResumo.limiteDisponivel < 0
                              ? "text-red-600"
                              : "text-emerald-600"
                          }
                        />
                        <MiniResumoBox
                          label="Parcelado futuro"
                          value={moeda(cartaoResumo.totalParceladoFuturo)}
                        />
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <StatusInfo
                          label="Fechamento"
                          value={`Dia ${cartao?.fechamento_dia ?? "-"}`}
                        />
                        <StatusInfo
                          label="Vencimento"
                          value={`Dia ${cartao?.vencimento_dia ?? "-"}`}
                        />
                        <StatusInfo
                          label="Status"
                          value={estourado ? "Limite estourado" : "Dentro do limite"}
                          danger={estourado}
                          success={!estourado}
                        />
                      </div>

                      <div className="mt-5 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Uso do limite</span>
                          <span
                            className={`font-medium ${
                              estourado ? "text-red-600" : "text-slate-900"
                            }`}
                          >
                            {percentualUso.toFixed(1)}%
                          </span>
                        </div>

                        <div className="h-3 w-full rounded-full bg-slate-200">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              estourado ? "bg-red-500" : "bg-slate-900"
                            }`}
                            style={{ width: `${Math.min(percentualUso, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {abaAtiva === "faturas" && (
          <div className="space-y-5">
            {loading ? (
              <EmptyCard text="Carregando faturas..." />
            ) : dadosFaturas.length === 0 ? (
              <EmptyCard text="Nenhum cartão cadastrado ainda." />
            ) : (
              dadosFaturas.map(
                ({
                  cartao,
                  meses,
                  totalCartao,
                  proximaFatura,
                  faturaMesAtual,
                  totalUsadoAtual,
                  limiteDisponivel,
                  percentualUso,
                  estourado,
                  competenciaProxima,
                }) => {
                  const aberto = cartaoAberto === cartao.id;

                  return (
                    <div
                      key={cartao.id}
                      className="rounded-[30px] border border-slate-200 bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        className="w-full px-6 py-6 text-left"
                        onClick={() => setCartaoAberto(aberto ? null : cartao.id)}
                      >
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-slate-900">
                                {cartao.nome}
                              </h3>
                              {aberto ? (
                                <ChevronUp className="h-4 w-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                            <p className="text-sm text-slate-500">
                              Total projetado: {moeda(totalCartao)}
                            </p>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2 xl:min-w-130">
                            <MiniResumoBox
                              label="Próxima fatura"
                              value={
                                proximaFatura ? moeda(proximaFatura.total) : moeda(0)
                              }
                              sublabel={
                                proximaFatura
                                  ? `${formatarMes(proximaFatura.mes)} • vence em ${proximaFatura.vencimento}`
                                  : "Sem parcelas futuras"
                              }
                            />
                            <MiniResumoBox
                              label="Fatura do mês atual"
                              value={
                                faturaMesAtual ? moeda(faturaMesAtual.total) : moeda(0)
                              }
                              sublabel={
                                faturaMesAtual
                                  ? `${formatarMes(faturaMesAtual.mes)} • vence em ${faturaMesAtual.vencimento}`
                                  : "Sem cobrança neste mês"
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                          <StatusInfo label="Limite" value={moeda(Number(cartao.limite ?? 0))} />
                          <StatusInfo
                            label="Total lançado no cartão"
                            value={moeda(totalUsadoAtual)}
                          />
                          <StatusInfo
                            label="Limite disponível"
                            value={moeda(limiteDisponivel)}
                            danger={limiteDisponivel < 0}
                            success={limiteDisponivel >= 0}
                          />
                          <StatusInfo
                            label="Status"
                            value={estourado ? "Limite estourado" : "Dentro do limite"}
                            danger={estourado}
                            success={!estourado}
                          />
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Uso do limite</span>
                            <span
                              className={`font-medium ${
                                estourado ? "text-red-600" : "text-slate-900"
                              }`}
                            >
                              {percentualUso.toFixed(1)}%
                            </span>
                          </div>

                          <div className="h-3 w-full rounded-full bg-slate-200">
                            <div
                              className={`h-3 rounded-full transition-all ${
                                estourado ? "bg-red-500" : "bg-slate-900"
                              }`}
                              style={{ width: `${Math.min(percentualUso, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600">
                          <span className="font-medium">
                            Competência esperada da próxima cobrança:
                          </span>{" "}
                          {formatarMes(competenciaProxima)}
                        </div>
                      </button>

                      {aberto && (
                        <div className="space-y-4 border-t border-slate-200 px-6 py-5">
                          {meses.length === 0 ? (
                            <p className="text-sm text-slate-500">
                              Nenhuma despesa em cartão encontrada.
                            </p>
                          ) : (
                            meses.map((mes) => {
                              const keyMes = `${cartao.id}-${mes.mes}`;
                              const abertoMes = mesAberto === keyMes;
                              const estaPagando = pagandoKey === keyMes;

                              return (
                                <div
                                  key={keyMes}
                                  className="overflow-hidden rounded-2xl border border-slate-200"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setMesAberto(abertoMes ? null : keyMes)
                                    }
                                    className="flex w-full items-center justify-between gap-3 bg-white px-4 py-4 text-left transition hover:bg-slate-50"
                                  >
                                    <div>
                                      <p className="font-medium text-slate-900">
                                        {formatarMes(mes.mes)}
                                      </p>
                                      <p className="text-sm text-slate-500">
                                        Vencimento em {mes.vencimento}
                                      </p>
                                    </div>

                                    <div className="text-right">
                                      <p className="font-semibold text-slate-900">
                                        {moeda(mes.total)}
                                      </p>
                                      <p
                                        className={`text-xs font-medium ${
                                          mes.status === "paga"
                                            ? "text-emerald-600"
                                            : "text-amber-600"
                                        }`}
                                      >
                                        {mes.status === "paga" ? "Paga" : "Aberta"}
                                      </p>
                                    </div>
                                  </button>

                                  <div className="border-t border-slate-200 p-4">
                                    {mes.status === "paga" ? (
                                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-start gap-3">
                                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                                          <div>
                                            <p className="text-sm font-medium text-slate-900">
                                              Fatura quitada
                                            </p>
                                            <p className="text-xs text-slate-500">
                                              {mes.pagamento?.data_pagamento
                                                ? `Pago em ${mes.pagamento.data_pagamento}`
                                                : "Pagamento registrado"}
                                            </p>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            void desfazerPagamento(cartao.id, mes.mes);
                                          }}
                                          disabled={estaPagando}
                                          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                          {estaPagando
                                            ? "Desfazendo..."
                                            : "Desfazer pagamento"}
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-start gap-3">
                                          <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                                          <div>
                                            <p className="text-sm font-medium text-slate-900">
                                              Pagamento da fatura
                                            </p>
                                            <p className="text-xs text-slate-500">
                                              Ao pagar, essa competência passa a contar
                                              como quitada.
                                            </p>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            void pagarFatura(
                                              cartao.id,
                                              mes.mes,
                                              mes.total
                                            );
                                          }}
                                          disabled={estaPagando || mes.status === "paga"}
                                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                          {estaPagando ? "Pagando..." : "Pagar fatura"}
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {abertoMes && (
                                    <div className="space-y-2 border-t border-slate-200 bg-slate-50/60 p-4">
                                      {mes.itens.map((item, index) => (
                                        <div
                                          key={`${keyMes}-${item.despesaId}-${index}`}
                                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3"
                                        >
                                          <div>
                                            <p className="font-medium text-slate-900">
                                              {item.descricao}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                              Parcela {item.parcelaAtual} de{" "}
                                              {item.totalParcelas}
                                            </p>
                                          </div>

                                          <span className="font-semibold text-slate-900">
                                            {moeda(item.valor)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              )
            )}
          </div>
        )}

        {abaAtiva === "cartoes" && (
          <div className="space-y-6">
            <SectionCard className="rounded-[30px]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Cartões cadastrados
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Cadastre, edite e acompanhe os cartões da sua carteira.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={abrirNovoCartao}
                  className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-95"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo cartão
                </button>
              </div>
            </SectionCard>

            {loading ? (
              <EmptyCard text="Carregando cartões..." />
            ) : cartoes.length === 0 ? (
              <EmptyCard text="Nenhum cartão cadastrado ainda." />
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {cartoes.map((cartao) => (
                  <div
                    key={cartao.id}
                    className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {cartao.nome}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Limite: {moeda(Number(cartao.limite ?? 0))}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditarCartao(cartao)}
                          className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleExcluirCartao(cartao.id)}
                          className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <MiniResumoBox
                        label="Fechamento"
                        value={`Dia ${cartao.fechamento_dia}`}
                      />
                      <MiniResumoBox
                        label="Vencimento"
                        value={`Dia ${cartao.vencimento_dia}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {abaAtiva === "ajustes" && (
          <div className="space-y-6">
            <SectionCard className="rounded-[30px]">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Saldo inicial do cartão
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Lance valores já existentes nas próximas faturas sem cadastrar compra por compra.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FieldBlock label="Cartão" htmlFor="cartaoSaldoInicial">
                    <select
                      id="cartaoSaldoInicial"
                      value={cartaoSaldoInicialId}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        setCartaoSaldoInicialId(e.target.value)
                      }
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                    >
                      <option value="">Selecione</option>
                      {cartoes.map((cartao) => (
                        <option key={cartao.id} value={cartao.id}>
                          {cartao.nome}
                        </option>
                      ))}
                    </select>
                  </FieldBlock>

                  <FieldBlock label="Mês inicial" htmlFor="mesInicialSaldo">
                    <input
                      id="mesInicialSaldo"
                      type="month"
                      value={mesInicialSaldo}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setMesInicialSaldo(e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                    />
                  </FieldBlock>

                  <FieldBlock
                    label="Quantidade de meses"
                    htmlFor="quantidadeMesesSaldo"
                  >
                    <input
                      id="quantidadeMesesSaldo"
                      type="number"
                      min="1"
                      value={quantidadeMesesSaldo}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setQuantidadeMesesSaldo(e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                    />
                  </FieldBlock>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={gerarLinhasSaldoInicial}
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-95"
                  >
                    Gerar meses
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCartaoSaldoInicialId("");
                      setMesInicialSaldo(getMesAtual());
                      setQuantidadeMesesSaldo("1");
                      setLinhasSaldoInicial([{ mes: getMesAtual(), valor: "" }]);
                    }}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Limpar
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <MiniResumoBox
                    label="Meses gerados"
                    value={String(linhasSaldoInicial.length)}
                  />
                  <MiniResumoBox
                    label="Total do saldo inicial"
                    value={moeda(totalSaldoInicial)}
                  />
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Use isso para lançar valores já existentes nas próximas faturas
                  do cartão, sem precisar cadastrar compra por compra.
                </div>

                <div className="space-y-3">
                  {linhasSaldoInicial.map((linha, index) => (
                    <div
                      key={`${linha.mes}-${index}`}
                      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_220px]"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {formatarMes(linha.mes)}
                        </p>
                        <p className="text-sm text-slate-500">
                          Competência inicial da cobrança
                        </p>
                      </div>

                      <FieldBlock label="Valor" htmlFor={`valor-saldo-${index}`}>
                        <input
                          id={`valor-saldo-${index}`}
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={linha.valor}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            atualizarValorLinhaSaldo(index, e.target.value)
                          }
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                        />
                      </FieldBlock>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void salvarSaldoInicial()}
                    disabled={salvandoSaldoInicial}
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {salvandoSaldoInicial
                      ? "Salvando saldo inicial..."
                      : "Salvar saldo inicial"}
                  </button>
                </div>
              </div>
            </SectionCard>
          </div>
        )}
      </PageShell>

      {sheetCartaoAberto && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px]"
            onClick={fecharSheetCartao}
          />

          <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {idEmEdicao !== null ? "Editar cartão" : "Novo cartão"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Cadastre o cartão com limite, fechamento e vencimento.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharSheetCartao}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleSalvarCartao}
              className="flex flex-1 flex-col overflow-y-auto"
            >
              <div className="space-y-6 px-6 py-6">
                <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Dados do cartão
                  </h3>

                  <FieldBlock label="Nome do cartão" htmlFor="nome">
                    <input
                      id="nome"
                      type="text"
                      placeholder="Ex: Nubank"
                      value={nome}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setNome(e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                    />
                  </FieldBlock>

                  <FieldBlock label="Limite" htmlFor="limite">
                    <input
                      id="limite"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 1500.00"
                      value={limite}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setLimite(e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                    />
                  </FieldBlock>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldBlock label="Dia de fechamento" htmlFor="fechamentoDia">
                      <input
                        id="fechamentoDia"
                        type="number"
                        min="1"
                        max="31"
                        placeholder="Ex: 5"
                        value={fechamentoDia}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setFechamentoDia(e.target.value)
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                      />
                    </FieldBlock>

                    <FieldBlock label="Dia de vencimento" htmlFor="vencimentoDia">
                      <input
                        id="vencimentoDia"
                        type="number"
                        min="1"
                        max="31"
                        placeholder="Ex: 12"
                        value={vencimentoDia}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setVencimentoDia(e.target.value)
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                      />
                    </FieldBlock>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                    Esse cadastro define o limite do cartão e a regra base de fechamento
                    e vencimento usada nas projeções de fatura.
                  </div>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={fecharSheetCartao}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-95"
                >
                  {idEmEdicao !== null ? "Atualizar cartão" : "Salvar cartão"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}
    </>
  );
}

function AbaButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ResumoCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-linear-to-br from-slate-50 to-white p-6 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        {icon}
        {title}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function MiniResumo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function MiniResumoBox({
  label,
  value,
  sublabel,
  valueClassName,
}: {
  label: string;
  value: string;
  sublabel?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-1 text-lg font-bold text-slate-900 ${valueClassName ?? ""}`}
      >
        {value}
      </p>
      {sublabel ? <p className="mt-1 text-xs text-slate-500">{sublabel}</p> : null}
    </div>
  );
}

function StatusInfo({
  label,
  value,
  danger,
  success,
}: {
  label: string;
  value: string;
  danger?: boolean;
  success?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        danger
          ? "border-red-200 bg-red-50"
          : success
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200"
      }`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-1 font-semibold ${
          danger
            ? "text-red-600"
            : success
            ? "text-emerald-700"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
      {text}
    </div>
  );
}

function FieldBlock({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getMesAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

function adicionarMeses(mesBase: string, quantidade: number) {
  const [ano, mes] = mesBase.split("-").map(Number);
  const data = new Date(ano, mes - 1 + quantidade, 1);
  const novoAno = data.getFullYear();
  const novoMes = String(data.getMonth() + 1).padStart(2, "0");
  return `${novoAno}-${novoMes}`;
}

function formatarMes(mesAno: string) {
  const [ano, mes] = mesAno.split("-");
  const nomes = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return `${nomes[Number(mes) - 1]} de ${ano}`;
}

function formatarVencimento(mesAno: string, vencimentoDia: number) {
  const [ano, mes] = mesAno.split("-");
  const dia = String(vencimentoDia).padStart(2, "0");
  return `${dia}/${mes}/${ano}`;
}

function getDataHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function getProximaCompetencia(vencimentoDia: number) {
  const hoje = new Date();
  const diaAtual = hoje.getDate();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  const dataCompetencia =
    diaAtual > vencimentoDia
      ? new Date(ano, mes + 1, 1)
      : new Date(ano, mes, 1);

  const competenciaAno = dataCompetencia.getFullYear();
  const competenciaMes = String(dataCompetencia.getMonth() + 1).padStart(2, "0");

  return `${competenciaAno}-${competenciaMes}`;
}