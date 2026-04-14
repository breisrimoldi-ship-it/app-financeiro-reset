"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ModalResumoDashboard } from "./_components/modal-resumo-dashboard";
import { InteligenciaMesSection } from "./_components/inteligencia-mes-section";
import { ResumoCards, type ResumoCardAtivo } from "./_components/resumo-cards";
import { MiniBarChart } from "./_components/mini-bar-chart";
import { DashboardSkeleton } from "./_components/dashboard-skeleton";
import { ModalLancamentoDashboard } from "./_components/modal-lancamento-dashboard";
import { createClient } from "../../../lib/supabase/client";
import {
  CalendarDays,
  CreditCard,
  Plus,
  Target,
} from "lucide-react";
import { normalizarNumero } from "@/lib/finance/format";

import type {
  FormType,
  Movimentacao,
  FaturaPagamento,
  Cartao,
  ContaFixaDashboard,
  PagamentoContaDashboard,
  ResumoCartao,
  ChartPoint,
  MetasSnapshot,
  MetaPlanoRadar,
  CardAtivo,
  ModalLancamentoItem,
  ActionFormData,
  RecomendacaoAcao,
  MetaRecord,
  MetaAporteRecord,
} from "./_lib/types";

import {
  getMesAtual,
  getHoje,
  getInitialActionForm,
  formatarMoeda,
  formatarMesExtenso,
  adicionarMeses,
  formatarMesCurto,
  formatarCompetencia,
  formatarData,
  formatarTipoPagamento,
  percentualSeguro,
  getCardNome,
  getCategoriaLabelSeguro,
  calcularPrimeiraCobranca,
  contaExisteNoMes,
  contaEstaPendenteAteMes,
  getStatusContaDashboard,
  gerarSugestoesReceita,
  calcularSnapshotDoMes,
  formatarPrazoCurto,
  calcularPlanoMeta,
  gerarInsights,
  gerarPrevisao,
  calcularMetasSnapshotComAportes,
  gerarRecomendacoes,
} from "./_lib/utils";

const supabase = createClient();

export default function DashboardPage() {
  const [mesSelecionado, setMesSelecionado] = useState(getMesAtual());
  const [saldoInicialMes, setSaldoInicialMes] = useState(0);
  const [entradasMes, setEntradasMes] = useState(0);
  const [saidasPagasMes, setSaidasPagasMes] = useState(0);
  const [comprometido, setComprometido] = useState(0);
  const [comprometidoMes, setComprometidoMes] = useState(0);
  const [comprometidoAtrasado, setComprometidoAtrasado] = useState(0);
  const [saldoDisponivel, setSaldoDisponivel] = useState(0);
  const [adiantadasMes, setAdiantadasMes] = useState(0);
  const [saldoCpf, setSaldoCpf] = useState(0);
  const [saldoPj, setSaldoPj] = useState(0);
  const [saidasContasFaturas, setSaidasContasFaturas] = useState(0);

  const [metasResumo, setMetasResumo] = useState<MetasSnapshot>({
    totalGuardado: 0,
    quantidadeAtivas: 0,
    metaMaisProxima: null,
    metasOrdenadas: [],
  });

  const [cartoesResumo, setCartoesResumo] = useState<ResumoCartao[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  const [movimentacoesCache, setMovimentacoesCache] = useState<Movimentacao[]>([]);
  const [faturasPagamentoCache, setFaturasPagamentoCache] = useState<FaturaPagamento[]>([]);
  const [cartoesCache, setCartoesCache] = useState<Cartao[]>([]);
  const [contasCache, setContasCache] = useState<ContaFixaDashboard[]>([]);
  const [pagamentosContasCache, setPagamentosContasCache] = useState<
    PagamentoContaDashboard[]
  >([]);

  const [cardAtivo, setCardAtivo] = useState<CardAtivo>(null);
  const [buscaModal, setBuscaModal] = useState("");

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionFormType, setActionFormType] = useState<FormType>("entrada");
  const [actionFormData, setActionFormData] = useState<ActionFormData>(getInitialActionForm());
  const [savingAction, setSavingAction] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [carregando, setCarregando] = useState(true);

  const resetActionForm = useCallback(() => {
    setActionFormData(getInitialActionForm());
  }, []);

  const openActionModal = useCallback((type: FormType) => {
    setActionFormType(type);
    setActionFormData({
      ...getInitialActionForm(),
      data: getHoje(),
    });
    setActionModalOpen(true);
  }, []);

  const closeActionModal = useCallback(() => {
    setActionModalOpen(false);
    resetActionForm();
  }, [resetActionForm]);

  const carregarDashboard = useCallback(async () => {
    setCarregando(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      setCarregando(false);
      return;
    }

    if (!user) {
      setCarregando(false);
      return;
    }

    const [
      { data: movimentacoesData, error: movimentacoesError },
      { data: faturasPagamentoData, error: faturasPagamentoError },
      { data: cartoesData, error: cartoesError },
      { data: metasData, error: metasError },
      { data: metaAportesData, error: metaAportesError },
      { data: contasData, error: contasError },
      { data: pagamentosContasData, error: pagamentosContasError },
      { data: contasBancariasData },
    ] = await Promise.all([
      supabase
        .from("movimentacoes")
        .select(
          "id, created_at, tipo, descricao, categoria, valor, data, tipo_pagamento, cartao_id, parcelas, primeira_cobranca, meta_id, meta_aporte_id, conta_id, conta_destino_id"
        ),

      supabase
        .from("faturas_pagamento")
        .select("id, cartao_id, mes_referencia, valor_pago, data_pagamento, status"),

      supabase
        .from("cartoes")
        .select("id, nome, fechamento_dia, vencimento_dia, limite"),

      supabase
        .from("metas")
        .select("*")
        .eq("user_id", user.id),

      supabase
        .from("meta_aportes")
        .select("*")
        .eq("user_id", user.id),

      supabase.from("contas_fixas").select("*"),

      supabase.from("pagamentos_contas").select("*"),

      supabase
        .from("contas_bancarias")
        .select("id, nome, tipo, saldo_inicial")
        .eq("ativo", true),
    ]);

    if (metasError || metaAportesError) {
      setMetasResumo({
        totalGuardado: 0,
        quantidadeAtivas: 0,
        metaMaisProxima: null,
        metasOrdenadas: [],
      });
    } else {
      const metasNormalizadas = calcularMetasSnapshotComAportes(
        (metasData ?? []) as MetaRecord[],
        (metaAportesData ?? []) as MetaAporteRecord[]
      );

      setMetasResumo(metasNormalizadas);
    }

    if (
      movimentacoesError ||
      faturasPagamentoError ||
      cartoesError ||
      contasError ||
      pagamentosContasError
    ) {
      setCarregando(false);
      return;
    }

    const movimentacoes = (movimentacoesData ?? []) as Movimentacao[];
    const faturasPagamento = (faturasPagamentoData ?? []) as FaturaPagamento[];
    const cartoes = (cartoesData ?? []) as Cartao[];
    const contas = (contasData ?? []) as ContaFixaDashboard[];
    const pagamentosContas =
      (pagamentosContasData ?? []) as PagamentoContaDashboard[];

    setMovimentacoesCache(movimentacoes);
    setFaturasPagamentoCache(faturasPagamento);
    setCartoesCache(cartoes);
    setContasCache(contas);
    setPagamentosContasCache(pagamentosContas);

    const atual = calcularSnapshotDoMes(
      mesSelecionado,
      movimentacoes,
      faturasPagamento,
      cartoes,
      contas,
      pagamentosContas
    );

    setSaldoInicialMes(atual.saldoInicial);
    setEntradasMes(atual.entradas);
    setSaidasPagasMes(atual.saidasPagas);
    setComprometido(atual.comprometido);
    setComprometidoMes(atual.comprometidoMes);
    setComprometidoAtrasado(atual.comprometidoAtrasado);
    setSaldoDisponivel(atual.saldoDisponivel);
    setAdiantadasMes(atual.adiantadas);
    setSaidasContasFaturas(atual.saidasContasFaturas);

    // Compute per-type bank account balances
    const contasBancarias = (contasBancariasData ?? []) as {
      id: string;
      nome: string;
      tipo: string;
      saldo_inicial: number;
    }[];

    const calcSaldoPorTipo = (tipoFiltro: string) => {
      const contasTipo = contasBancarias.filter((c) => c.tipo === tipoFiltro);
      let total = 0;
      for (const conta of contasTipo) {
        let saldo = normalizarNumero(conta.saldo_inicial);
        for (const mov of movimentacoes) {
          if (mov.conta_id === conta.id) {
            const tipoMov = (mov.tipo ?? "").toLowerCase();
            const tipoPag = (mov.tipo_pagamento ?? "").toLowerCase();
            const valor = normalizarNumero(mov.valor);
            if (tipoMov === "entrada") saldo += valor;
            else if (tipoMov === "despesa" && tipoPag !== "credito") saldo -= valor;
            else if (tipoMov === "transferencia") saldo -= valor;
          }
          if ((mov.tipo ?? "").toLowerCase() === "transferencia" && mov.conta_destino_id === conta.id) {
            saldo += normalizarNumero(mov.valor);
          }
        }
        total += saldo;
      }
      return total;
    };

    setSaldoCpf(calcSaldoPorTipo("cpf"));
    setSaldoPj(calcSaldoPorTipo("pj"));

    const meses = Array.from({ length: 6 }, (_, index) =>
      adicionarMeses(mesSelecionado, -(5 - index))
    );

    const historico = meses.map((mesRef) => {
      const snap = calcularSnapshotDoMes(
        mesRef,
        movimentacoes,
        faturasPagamento,
        cartoes,
        contas,
        pagamentosContas
      );

      return {
        mes: mesRef,
        label: formatarMesCurto(mesRef),
        entradas: snap.entradas,
        saidas: snap.saidasPagas,
        saldo: snap.saldoDisponivel,
      };
    });

    setCartoesResumo(atual.cartoesResumo);
    setChartData(historico);
    setCarregando(false);
  }, [mesSelecionado]);

  useEffect(() => {
    let ativo = true;

    const executar = async () => {
      if (!ativo) return;
      await carregarDashboard();
    };

    void executar();

    return () => {
      ativo = false;
    };
  }, [carregarDashboard]);

  const usoRealPercentual = useMemo(() => {
    return percentualSeguro(saidasPagasMes, entradasMes);
  }, [saidasPagasMes, entradasMes]);

  const usoProjetadoPercentual = useMemo(() => {
    return percentualSeguro(saidasPagasMes + comprometido, entradasMes);
  }, [saidasPagasMes, comprometido, entradasMes]);

  const sobraProjetada = useMemo(() => {
    return entradasMes - saidasPagasMes - comprometido;
  }, [entradasMes, saidasPagasMes, comprometido]);

  const insights = useMemo(() => {
    return gerarInsights({
      entradas: entradasMes,
      saidas: saidasPagasMes,
      comprometido,
      saldo: sobraProjetada,
      metas: metasResumo,
    });
  }, [entradasMes, saidasPagasMes, comprometido, sobraProjetada, metasResumo]);

  const previsao = useMemo(() => {
    return gerarPrevisao({
      entradas: entradasMes,
      saidas: saidasPagasMes,
      comprometido,
    });
  }, [entradasMes, saidasPagasMes, comprometido]);

  const recomendacoes = useMemo(() => {
    return gerarRecomendacoes({
      saldo: saldoDisponivel,
      previsao,
      metas: metasResumo,
    });
  }, [saldoDisponivel, previsao, metasResumo]);

  const metasNoRadar = useMemo(() => {
    return (metasResumo.metasOrdenadas ?? [])
      .slice(0, 3)
      .map((meta, index) => calcularPlanoMeta(meta, saldoDisponivel, index + 1))
      .filter((item): item is MetaPlanoRadar => item !== null);
  }, [metasResumo.metasOrdenadas, saldoDisponivel]);

  const alertasContas = useMemo(() => {
    const contasDoMes = contasCache.filter((conta) =>
      contaEstaPendenteAteMes(conta, mesSelecionado, pagamentosContasCache)
    );

    const itens = contasDoMes
      .map((conta) => {
        const info = getStatusContaDashboard(
          conta,
          mesSelecionado,
          pagamentosContasCache
        );

        return {
          conta,
          ...info,
        };
      })
      .filter((item) =>
        ["vencida", "vence_hoje", "vence_breve"].includes(item.status)
      )
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));

    return {
      vencidas: itens.filter((item) => item.status === "vencida"),
      vencemHoje: itens.filter((item) => item.status === "vence_hoje"),
      vencemBreve: itens.filter((item) => item.status === "vence_breve"),
      total: itens.length,
      itens,
    };
  }, [contasCache, mesSelecionado, pagamentosContasCache]);

  const sugestoesReceita = useMemo(() => {
    return gerarSugestoesReceita({
      saldoProjetado: sobraProjetada,
      alertasContas,
      metas: metasResumo,
    });
  }, [sobraProjetada, alertasContas, metasResumo]);

  const modalResumo = useMemo(() => {
    const [ano, mes] = mesSelecionado.split("-").map(Number);
    const inicioMes = `${mesSelecionado}-01`;
    const proximoMes =
      mes === 12
        ? `${ano + 1}-01-01`
        : `${ano}-${String(mes + 1).padStart(2, "0")}-01`;

    const movimentacoesMes = movimentacoesCache.filter((item) => {
      const data = item.data ?? "";
      return data >= inicioMes && data < proximoMes;
    });

    const movimentacoesCredito = movimentacoesCache.filter(
      (item) =>
        (item.tipo ?? "").toLowerCase() === "despesa" &&
        (item.tipo_pagamento ?? "").toLowerCase() === "credito" &&
        !!item.cartao_id
    );

    if (cardAtivo === "entradas") {
      const itens: ModalLancamentoItem[] = movimentacoesMes
        .filter((item) => (item.tipo ?? "").toLowerCase() === "entrada")
        .map((item) => ({
          id: `entrada-${item.id}`,
          tipo: "entrada",
          titulo: item.descricao || "Entrada",
          categoria: getCategoriaLabelSeguro(item.categoria),
          valor: normalizarNumero(item.valor),
          dataPrincipal: formatarData(item.data),
          pagamentoLabel: "Recebimento",
        }));

      return {
        titulo: "Entradas do mês",
        subtitulo: `Todos os lançamentos de entrada de ${formatarMesExtenso(
          mesSelecionado
        )}.`,
        itens,
      };
    }

    if (cardAtivo === "saidas") {
      const itensDespesas: ModalLancamentoItem[] = movimentacoesMes
        .filter(
          (item) =>
            (item.tipo ?? "").toLowerCase() === "despesa" &&
            (item.tipo_pagamento ?? "").toLowerCase() !== "credito"
        )
        .map((item) => ({
          id: `saida-${item.id}`,
          tipo: "despesa",
          titulo: item.descricao || "Despesa",
          categoria: getCategoriaLabelSeguro(item.categoria),
          valor: normalizarNumero(item.valor),
          dataPrincipal: formatarData(item.data),
          pagamentoLabel: formatarTipoPagamento(item.tipo_pagamento),
        }));

      const itensFaturasPagas: ModalLancamentoItem[] = faturasPagamentoCache
        .filter(
          (item) =>
            (item.status ?? "").toLowerCase() === "paga" &&
            item.data_pagamento?.slice(0, 7) === mesSelecionado
        )
        .map((item) => ({
          id: `fatura-paga-${item.id}`,
          tipo: "fatura",
          titulo: `Pagamento de fatura • ${getCardNome(cartoesCache, item.cartao_id)}`,
          categoria: "Pagamento de fatura",
          valor: normalizarNumero(item.valor_pago),
          dataPrincipal: formatarData(item.data_pagamento),
          competencia: item.mes_referencia,
          cartaoNome: getCardNome(cartoesCache, item.cartao_id),
          pagamentoLabel: "Fatura paga",
        }));

      const itensContasPagas: ModalLancamentoItem[] = pagamentosContasCache
        .filter(
          (item) =>
            (item.status ?? "").toLowerCase() === "paga" &&
            item.data_pagamento?.slice(0, 7) === mesSelecionado &&
            item.mes_referencia === mesSelecionado
        )
        .map((item) => {
          const conta = contasCache.find(
            (contaItem) => contaItem.id === Number(item.origem_id)
          );

          return {
            id: `conta-paga-${item.id}`,
            tipo: "conta" as const,
            titulo: conta?.descricao || "Conta paga",
            categoria: conta?.categoria || "Conta",
            valor: normalizarNumero(item.valor_pago || conta?.valor),
            dataPrincipal: formatarData(item.data_pagamento),
            pagamentoLabel: "Conta paga",
            competencia: `Competência ${formatarCompetencia(item.mes_referencia || "")}`,
          };
        });

      return {
        titulo: "Saídas pagas",
        subtitulo: `Despesas à vista, contas e faturas pagas em ${formatarMesExtenso(
          mesSelecionado
        )}.`,
        itens: [...itensDespesas, ...itensContasPagas, ...itensFaturasPagas],
      };
    }

    if (cardAtivo === "adiantadas") {
      const itens: ModalLancamentoItem[] = [];
      const faturasProjetadas = new Map<string, number>();

      for (const mov of movimentacoesCredito) {
        const cartaoId = Number(mov.cartao_id);
        const valorTotal = normalizarNumero(mov.valor);
        const parcelas = Number(mov.parcelas || 1);

        let primeiraCompetencia = mov.primeira_cobranca;
        if (!primeiraCompetencia && mov.data) {
          primeiraCompetencia = mov.data.slice(0, 7);
        }
        if (!primeiraCompetencia) continue;

        const valorParcela = valorTotal / parcelas;

        for (let i = 0; i < parcelas; i++) {
          const competencia = adicionarMeses(primeiraCompetencia, i);
          const chave = `${cartaoId}|${competencia}`;
          const atual = faturasProjetadas.get(chave) || 0;
          faturasProjetadas.set(chave, atual + valorParcela);
        }
      }

      for (const [chave, valorFatura] of faturasProjetadas.entries()) {
        const [cartaoIdStr, competencia] = chave.split("|");
        const cartaoId = Number(cartaoIdStr);

        const pagamento = faturasPagamentoCache.find(
          (item) =>
            item.cartao_id === cartaoId &&
            item.mes_referencia === competencia &&
            (item.status ?? "").toLowerCase() === "paga" &&
            item.data_pagamento?.slice(0, 7) === mesSelecionado
        );

        if (pagamento && competencia > mesSelecionado) {
          itens.push({
            id: `adiantada-${cartaoId}-${competencia}`,
            tipo: "adiantada",
            titulo: `Fatura adiantada • ${getCardNome(cartoesCache, cartaoId)}`,
            categoria: "Pagamento adiantado",
            valor: normalizarNumero(pagamento.valor_pago || valorFatura),
            dataPrincipal: formatarData(pagamento.data_pagamento),
            competencia,
            cartaoNome: getCardNome(cartoesCache, cartaoId),
            pagamentoLabel: "Pago antecipadamente",
          });
        }
      }

      return {
        titulo: "Adiantadas no mês",
        subtitulo: `Faturas futuras pagas em ${formatarMesExtenso(mesSelecionado)}.`,
        itens,
      };
    }

    if (cardAtivo === "comprometido") {
      const itens: ModalLancamentoItem[] = [];
      const faturasProjetadas = new Map<string, number>();

      for (const mov of movimentacoesCredito) {
        const cartaoId = Number(mov.cartao_id);
        const valorTotal = normalizarNumero(mov.valor);
        const parcelas = Number(mov.parcelas || 1);

        let primeiraCompetencia = mov.primeira_cobranca;
        if (!primeiraCompetencia && mov.data) {
          primeiraCompetencia = mov.data.slice(0, 7);
        }
        if (!primeiraCompetencia) continue;

        const valorParcela = valorTotal / parcelas;

        for (let i = 0; i < parcelas; i++) {
          const competencia = adicionarMeses(primeiraCompetencia, i);

          if (competencia <= mesSelecionado) {
            const chave = `${cartaoId}|${competencia}`;
            const atual = faturasProjetadas.get(chave) || 0;
            faturasProjetadas.set(chave, atual + valorParcela);
          }
        }
      }

      for (const [chave, valorFatura] of faturasProjetadas.entries()) {
        const [cartaoIdStr, competencia] = chave.split("|");
        const cartaoId = Number(cartaoIdStr);

        const pagamento = faturasPagamentoCache.find(
          (item) =>
            item.cartao_id === cartaoId &&
            item.mes_referencia === competencia &&
            (item.status ?? "").toLowerCase() === "paga"
        );

        if (!pagamento) {
          itens.push({
            id: `comprometido-${cartaoId}-${competencia}`,
            tipo: "fatura",
            titulo: `${getCardNome(cartoesCache, cartaoId)} • Fatura ${formatarCompetencia(
              competencia
            )}`,
            categoria: "Fatura em aberto",
            valor: valorFatura,
            dataPrincipal: `Competência ${formatarCompetencia(competencia)}`,
            competencia,
            cartaoNome: getCardNome(cartoesCache, cartaoId),
            pagamentoLabel: "Em aberto",
          });
        }
      }

      const contasAtivas = contasCache.filter((conta) => conta.ativa !== false);

      for (const conta of contasAtivas) {
        if (!conta.inicio_cobranca) continue;
        if (conta.inicio_cobranca > mesSelecionado) continue;

        const competencias: string[] = [];

        if (conta.tipo_recorrencia === "indeterminada") {
          let atual = conta.inicio_cobranca;
          while (atual <= mesSelecionado) {
            competencias.push(atual);
            atual = adicionarMeses(atual, 1);
          }
        } else {
          const ultimoMes = (() => {
            if (!conta.inicio_cobranca) return null;
            if (conta.fim_cobranca) return conta.fim_cobranca;
            if (conta.quantidade_meses && conta.quantidade_meses > 0) {
              return adicionarMeses(conta.inicio_cobranca, conta.quantidade_meses - 1);
            }
            return null;
          })();
          if (!ultimoMes) continue;

          let atual = conta.inicio_cobranca;
          while (atual <= mesSelecionado && atual <= ultimoMes) {
            competencias.push(atual);
            atual = adicionarMeses(atual, 1);
          }
        }

        for (const competencia of competencias) {
          const pagamento = pagamentosContasCache.find(
            (item) =>
              Number(item.origem_id) === conta.id &&
              item.mes_referencia === competencia &&
              (item.status ?? "").toLowerCase() === "paga"
          );

          if (!pagamento) {
            itens.push({
              id: `conta-aberta-${conta.id}-${competencia}`,
              tipo: "conta",
              titulo: conta.descricao,
              categoria: conta.categoria || "Conta",
              valor: normalizarNumero(conta.valor),
              dataPrincipal: `Vencimento dia ${String(
                conta.dia_vencimento || 1
              ).padStart(2, "0")}`,
              competencia: `Competência ${formatarCompetencia(competencia)}`,
              pagamentoLabel: "Conta em aberto",
            });
          }
        }
      }

      return {
        titulo: "Comprometido",
        subtitulo: `Faturas e contas em aberto acumuladas até ${formatarMesExtenso(
          mesSelecionado
        )}.`,
        itens,
      };
    }

    if (cardAtivo === "contas") {
      const itens = contasCache
        .filter(
          (conta) => conta.ativa !== false && contaExisteNoMes(conta, mesSelecionado)
        )
        .map((conta) => {
          const pagamento = pagamentosContasCache.find(
            (item) =>
              Number(item.origem_id) === conta.id &&
              item.mes_referencia === mesSelecionado &&
              (item.status ?? "").toLowerCase() === "paga"
          );

          return {
            id: `conta-${conta.id}-${mesSelecionado}`,
            tipo: "conta" as const,
            titulo: conta.descricao,
            categoria: conta.categoria || "Conta",
            valor: normalizarNumero(conta.valor),
            dataPrincipal: pagamento?.data_pagamento
              ? formatarData(pagamento.data_pagamento)
              : `Vence dia ${String(conta.dia_vencimento || 1).padStart(2, "0")}`,
            pagamentoLabel: pagamento ? "Paga" : "Em aberto",
            competencia: `Competência ${formatarCompetencia(mesSelecionado)}`,
          };
        });

      return {
        titulo: "Contas do mês",
        subtitulo: `Contas recorrentes e temporárias de ${formatarMesExtenso(
          mesSelecionado
        )}.`,
        itens,
      };
    }

    return null;
  }, [
    cardAtivo,
    cartoesCache,
    contasCache,
    faturasPagamentoCache,
    mesSelecionado,
    movimentacoesCache,
    pagamentosContasCache,
  ]);

  const executarAcao = useCallback(
    async (acao: RecomendacaoAcao) => {
      if (acao.tipo !== "guardar_meta") return;

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        alert("Você precisa estar logado.");
        return;
      }

      const descricaoAporte = `Aporte rápido pela dashboard • ${acao.metaNome}`;
      const descricaoMovimentacao = `Aporte meta: ${acao.metaNome}`;
      const dataHoje = getHoje();

      const { data: aporteCriado, error: aporteError } = await supabase
        .from("meta_aportes")
        .insert({
          user_id: user.id,
          meta_id: acao.metaId,
          tipo: "aporte",
          valor: acao.valor,
          descricao: descricaoAporte,
          data: dataHoje,
        })
        .select("id")
        .single();

      if (aporteError || !aporteCriado) {
        alert("Não foi possível registrar o aporte na meta.");
        return;
      }

      const { error: movimentacaoError } = await supabase
        .from("movimentacoes")
        .insert({
          tipo: "despesa",
          descricao: descricaoMovimentacao,
          categoria: "aporte_meta",
          valor: acao.valor,
          data: dataHoje,
          tipo_pagamento: "pix_dinheiro",
          cartao_id: null,
          parcelas: null,
          primeira_cobranca: null,
          meta_id: acao.metaId,
          meta_aporte_id: aporteCriado.id,
        });

      if (movimentacaoError) {
        await supabase.from("meta_aportes").delete().eq("id", aporteCriado.id);
        alert(
          `Erro ao registrar despesa da meta:\n${
            movimentacaoError.message ?? "Sem mensagem"
          }`
        );
        return;
      }

      setToast(
        `Aporte de ${formatarMoeda(acao.valor)} realizado em ${acao.metaNome}`
      );

      await carregarDashboard();
      setTimeout(() => setToast(null), 2500);
    },
    [carregarDashboard]
  );

  const pagarContaDashboard = useCallback(
    async (conta: ContaFixaDashboard) => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        alert("Você precisa estar logado.");
        return;
      }

      const { error } = await supabase.from("pagamentos_contas").upsert(
        {
          origem_tipo: "fixa",
          origem_id: conta.id,
          mes_referencia: mesSelecionado,
          valor_pago: normalizarNumero(conta.valor),
          data_pagamento: getHoje(),
          status: "paga",
          user_id: user.id,
        },
        {
          onConflict: "origem_tipo,origem_id,mes_referencia",
        }
      );

      if (error) {
        alert(`Erro ao pagar conta: ${error.message}`);
        return;
      }

      await supabase.from("movimentacoes").insert({
        tipo: "despesa",
        descricao: `Pagamento conta: ${conta.descricao} (${mesSelecionado})`,
        categoria: "pagamento_conta",
        valor: normalizarNumero(conta.valor),
        data: getHoje(),
        tipo_pagamento: "pix_dinheiro",
      });

      setToast(`Conta "${conta.descricao}" marcada como paga`);
      await carregarDashboard();
      setTimeout(() => setToast(null), 2500);
    },
    [carregarDashboard, mesSelecionado]
  );

  async function handleSaveAction(e: React.FormEvent) {
    e.preventDefault();

    if (
      !actionFormData.descricao.trim() ||
      !actionFormData.categoria ||
      !actionFormData.valor ||
      !actionFormData.data
    ) {
      alert("Preencha descrição, categoria, valor e data.");
      return;
    }

    const valorNumerico = Number(actionFormData.valor);

    if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    if (
      actionFormType === "despesa" &&
      actionFormData.tipoPagamento === "credito" &&
      !actionFormData.cartaoId
    ) {
      alert("Selecione o cartão.");
      return;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      alert("Você precisa estar logado.");
      return;
    }

    const primeiraCobrancaFinal =
      actionFormType === "despesa" && actionFormData.tipoPagamento === "credito"
        ? actionFormData.primeiraCobranca ||
          calcularPrimeiraCobranca(
            actionFormData.data,
            Number(actionFormData.cartaoId),
            cartoesCache
          )
        : "";

    const payload = {
      tipo: actionFormType,
      descricao: actionFormData.descricao.trim(),
      categoria: actionFormData.categoria,
      valor: valorNumerico,
      data: actionFormData.data,
      tipo_pagamento:
        actionFormType === "despesa" ? actionFormData.tipoPagamento : null,
      cartao_id:
        actionFormType === "despesa" && actionFormData.tipoPagamento === "credito"
          ? Number(actionFormData.cartaoId)
          : null,
      parcelas:
        actionFormType === "despesa" && actionFormData.tipoPagamento === "credito"
          ? Number(actionFormData.parcelas)
          : null,
      primeira_cobranca:
        actionFormType === "despesa" && actionFormData.tipoPagamento === "credito"
          ? primeiraCobrancaFinal
          : null,
    };

    setSavingAction(true);

    const { error } = await supabase.from("movimentacoes").insert(payload);

    if (error) {
      alert("Erro ao salvar movimentação.");
      setSavingAction(false);
      return;
    }

    setSavingAction(false);
    closeActionModal();
    await carregarDashboard();

    setToast(
      actionFormType === "entrada"
        ? "Entrada registrada com sucesso"
        : "Despesa registrada com sucesso"
    );

    setTimeout(() => setToast(null), 2500);
  }

  if (carregando) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] px-6 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_left,rgba(16,185,129,0.08),transparent_30%)]" />
            <div className="relative flex flex-col gap-6 p-6 md:p-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Referência: {formatarMesExtenso(mesSelecionado)}
                </div>
                <div className="space-y-1">
                  <h1 className="text-5xl font-bold tracking-tight text-zinc-900">
                    Dashboard
                  </h1>
                  <p className="text-base text-zinc-600">
                    Sua visão financeira atual, com foco no que importa agora.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => openActionModal("entrada")}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <Plus className="h-8 w-4" />
                    Nova entrada
                  </button>

                  <button
                    type="button"
                    onClick={() => openActionModal("despesa")}
                    className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
                  >
                    <Plus className="h-8 w-4" />
                    Nova despesa
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:w-full xl:max-w-160">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-emerald-700">
                    Saldo real em conta CPF
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-emerald-700">
                    {formatarMoeda(saldoCpf)}
                  </p>
                  <p className="mt-2 text-xs text-emerald-700/80">
                    Saldo acumulado nas contas bancárias CPF.
                  </p>
                </div>

                <div className="rounded-3xl border border-blue-200 bg-blue-50/80 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-blue-700">
                    Saldo em conta PJ
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-blue-700">
                    {formatarMoeda(saldoPj)}
                  </p>
                  <p className="mt-2 text-xs text-blue-700/80">
                    Saldo acumulado nas contas bancárias PJ.
                  </p>
                </div>

                <div className="rounded-3xl border border-red-200 bg-red-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-red-700">
                    Atrasado
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-red-700">
                    {formatarMoeda(comprometidoAtrasado)}
                  </p>
                  <p className="mt-2 text-xs text-red-700/80">
                    Contas e faturas pendentes de meses anteriores.
                  </p>
                </div>

                <div className="rounded-3xl border border-yellow-200 bg-yellow-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-yellow-700">
                    Comprometido do mês
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-yellow-700">
                    {formatarMoeda(comprometidoMes)}
                  </p>
                  <p className="mt-2 text-xs text-yellow-700/80">
                    O que ainda precisa sair nesta competência.
                  </p>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-white/90 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                    Entradas
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-900">
                    {formatarMoeda(entradasMes)}
                  </p>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-white/90 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                    Saídas contas/faturas
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-900">
                    {formatarMoeda(saidasContasFaturas)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Pagamentos de contas fixas e faturas no mês.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
            <div className="p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500">Filtro do dashboard</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
                    Mês de referência
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    Troque o mês para revisar rapidamente sua posição financeira.
                  </p>
                </div>

                <div className="w-full max-w-xs">
                  <label
                    htmlFor="mesSelecionado"
                    className="mb-2 block text-sm font-medium text-zinc-700"
                  >
                    Selecionar mês
                  </label>
                  <input
                    id="mesSelecionado"
                    type="month"
                    value={mesSelecionado}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMesSelecionado(e.target.value)
                    }
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400"
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-5">
                  <p className="text-sm font-medium text-zinc-500">Saldo inicial do mês</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
                    {formatarMoeda(saldoInicialMes)}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Valor carregado do mês anterior para abrir esta competência.
                  </p>
                </div>

                <div className="rounded-3xl border border-orange-200 bg-orange-50/80 p-5">
                  <p className="text-sm font-medium text-orange-700">Se pagar tudo hoje</p>
                  <p
                    className={`mt-2 text-3xl font-semibold tracking-tight ${
                      sobraProjetada >= 0 ? "text-orange-700" : "text-red-600"
                    }`}
                  >
                    {formatarMoeda(sobraProjetada)}
                  </p>
                  <p className="mt-2 text-sm text-orange-700/80">
                    Quanto sobraria depois de quitar tudo que ainda está em aberto.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
            <div className="p-6">
              <p className="text-sm font-medium text-zinc-500">Panorama rápido</p>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-zinc-600">Uso real do mês</span>
                    <span className="font-medium text-zinc-900">
                      {usoRealPercentual.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-zinc-900"
                      style={{ width: `${usoRealPercentual}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-zinc-600">Uso total projetado</span>
                    <span className="font-medium text-zinc-900">
                      {usoProjetadoPercentual.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${usoProjetadoPercentual}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                      Em atraso
                    </p>
                    <p className="mt-2 text-lg font-semibold text-red-600">
                      {formatarMoeda(comprometidoAtrasado)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                      Neste mês
                    </p>
                    <p className="mt-2 text-lg font-semibold text-yellow-700">
                      {formatarMoeda(comprometidoMes)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                      Total em aberto
                    </p>
                    <p className="mt-2 text-lg font-semibold text-orange-700">
                      {formatarMoeda(comprometido)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <InteligenciaMesSection
          insights={insights}
          previsao={previsao}
          recomendacoes={recomendacoes}
          sugestoesReceita={sugestoesReceita}
          alertasContas={alertasContas}
          formatarMoeda={formatarMoeda}
          formatarData={formatarData}
          normalizarNumero={normalizarNumero}
          pagarContaDashboard={pagarContaDashboard}
          executarAcao={executarAcao}
        />

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    <Target className="h-3.5 w-3.5" />
                    Meta em destaque
                  </div>

                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-zinc-900">
                    Foque na próxima meta
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    Um resumo simples, sem transformar a dashboard em uma tela de gestão completa.
                  </p>
                </div>

                <Link
                  href="/metas"
                  className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black"
                >
                  Ver metas
                </Link>
              </div>
            </div>

            <div className="p-6">
              {metasResumo?.metaMaisProxima ? (
                <div className="rounded-[28px] border border-zinc-200 bg-linear-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-6 text-white">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-300">
                    Meta mais próxima
                  </p>

                  <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold tracking-tight">
                        {metasResumo.metaMaisProxima.nome}
                      </h3>
                      <p className="mt-2 text-sm text-zinc-300">
                        {metasResumo.metaMaisProxima.prazo
                          ? `Prazo: ${formatarPrazoCurto(metasResumo.metaMaisProxima.prazo)}`
                          : "Sem prazo definido"}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-sm text-zinc-400">Faltam</p>
                      <p className="mt-1 text-2xl font-semibold text-white">
                        {formatarMoeda(metasResumo.metaMaisProxima.faltante)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-sm text-zinc-300">
                      <span>Progresso</span>
                      <span>{metasResumo.metaMaisProxima.percentual.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{ width: `${metasResumo.metaMaisProxima.percentual}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                        Guardado
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {formatarMoeda(metasResumo.metaMaisProxima.valorAtual)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                        Valor da meta
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {formatarMoeda(metasResumo.metaMaisProxima.valorMeta)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                        Metas ativas
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {metasResumo.quantidadeAtivas}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-10 text-center">
                  <p className="text-sm font-medium text-zinc-900">
                    Nenhuma meta ativa encontrada
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Assim que você cadastrar metas, este bloco assume esse espaço.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
              <div className="p-6">
                <p className="text-sm font-medium text-zinc-500">Resumo das metas</p>

                <div className="mt-4 grid gap-4">
                  <div className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-5">
                    <p className="text-sm font-medium text-zinc-500">Total guardado</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
                      {formatarMoeda(metasResumo?.totalGuardado ?? 0)}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-blue-200 bg-blue-50/80 p-5">
                    <p className="text-sm font-medium text-blue-700">Quanto falta</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-blue-700">
                      {formatarMoeda(metasResumo?.metaMaisProxima?.faltante ?? 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
              <div className="p-6">
                <p className="text-sm font-medium text-zinc-500">Metas no radar</p>

                <div className="mt-4 space-y-3">
                  {metasNoRadar.length === 0 ? (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                      Nenhuma meta com plano no radar agora.
                    </div>
                  ) : (
                    metasNoRadar.map((meta) => (
                      <div
                        key={`radar-${meta.id}`}
                        className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-zinc-900">
                              #{meta.prioridade} {meta.nome}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              Prazo: {formatarPrazoCurto(meta.prazo)}
                            </p>
                          </div>

                          <div className="rounded-xl bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700">
                            {meta.percentual.toFixed(0)}%
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-zinc-500">Falta</p>
                            <p className="font-semibold text-zinc-900">
                              {formatarMoeda(meta.faltante)}
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-500">Por dia</p>
                            <p className="font-semibold text-blue-700">
                              {formatarMoeda(meta.valorPorDia)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
              <div className="p-6">
                <p className="text-sm font-medium text-zinc-500">Cartões e comprometido</p>

                <div className="mt-4 space-y-3">
                  {cartoesResumo.slice(0, 3).map((cartao) => (
                    <div
                      key={cartao.id}
                      className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{cartao.nome}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Limite: {formatarMoeda(cartao.limite)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white p-2.5 text-zinc-700">
                          <CreditCard className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Em aberto</span>
                        <span className="font-medium text-orange-700">
                          {formatarMoeda(cartao.emAberto)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-3">
                  <Link
                    href="/cartoes"
                    className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    Ver cartões
                  </Link>

                  <Link
                    href="/contas"
                    className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    Ver contas
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ResumoCards
          entradasMesTexto={formatarMoeda(entradasMes)}
          saidasPagasMesTexto={formatarMoeda(saidasPagasMes)}
          comprometidoTexto={formatarMoeda(comprometido)}
          adiantadasMesTexto={formatarMoeda(adiantadasMes)}
          contasMesTexto={formatarMoeda(
            contasCache
              .filter(
                (conta) =>
                  conta.ativa !== false && contaExisteNoMes(conta, mesSelecionado)
              )
              .reduce((acc, conta) => acc + normalizarNumero(conta.valor), 0)
          )}
          cardAtivo={cardAtivo}
          onToggleCard={(card: ResumoCardAtivo) => {
            setBuscaModal("");
            setCardAtivo((prev) => (prev === card ? null : card));
          }}
        />

        <section className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-6 py-5">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
              Evolução dos últimos 6 meses
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              Comparativo entre entradas, saídas pagas e saldo disponível.
            </p>
          </div>

          <div className="p-6">
            <MiniBarChart data={chartData} />
          </div>
        </section>
      </div>

      {cardAtivo && modalResumo ? (
        <ModalResumoDashboard
          titulo={modalResumo.titulo}
          subtitulo={modalResumo.subtitulo}
          itens={modalResumo.itens}
          busca={buscaModal}
          setBusca={setBuscaModal}
          onClose={() => {
            setBuscaModal("");
            setCardAtivo(null);
          }}
        />
      ) : null}

      <ModalLancamentoDashboard
        open={actionModalOpen}
        onClose={closeActionModal}
        onSave={handleSaveAction}
        formType={actionFormType}
        setFormType={setActionFormType}
        formData={actionFormData}
        setFormData={setActionFormData}
        cartoes={cartoesCache}
        saving={savingAction}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-999">
          <div className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm text-white shadow-xl">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
