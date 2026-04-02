"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import { ResumoCards, type ResumoCardAtivo } from "./_components/resumo-cards";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CalendarDays,
  CreditCard,
  ExternalLink,
  Plus,
  Search,
  Tag,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import {
  getCategoryLabel,
  getCategoryOptions,
} from "@/lib/finance/categories";
import { getHojeISO, getMesAtualISO } from "@/lib/finance/date";
import { formatarMoedaBRL, normalizarNumero } from "@/lib/finance/format";
const supabase = createClient();

type PaymentType = "pix_dinheiro" | "debito" | "credito";
type FormType = "entrada" | "despesa";

type Movimentacao = {
  id: number;
  created_at: string;
  tipo: string | null;
  descricao: string | null;
  categoria: string | null;
  valor: number | string | null;
  data: string | null;
  tipo_pagamento: string | null;
  cartao_id: number | null;
  parcelas: number | null;
  primeira_cobranca: string | null;
  meta_id?: string | null;
  meta_aporte_id?: string | null;
};

type FaturaPagamento = {
  id: number;
  cartao_id: number;
  mes_referencia: string;
  valor_pago: number | string | null;
  data_pagamento: string | null;
  status: string | null;
};

type Cartao = {
  id: number;
  nome: string;
  fechamento_dia: number | null;
  vencimento_dia: number | null;
  limite: number | string | null;
};

type ContaFixaDashboard = {
  id: number;
  descricao: string;
  valor: number | string | null;
  dia_vencimento: number | null;
  categoria: string | null;
  observacoes: string | null;
  ativa: boolean;
  user_id: string | null;
  tipo_recorrencia: "indeterminada" | "temporaria";
  inicio_cobranca: string | null;
  fim_cobranca: string | null;
  quantidade_meses: number | null;
  created_at: string;
  updated_at: string;
};

type PagamentoContaDashboard = {
  id: number;
  origem_tipo: string | null;
  origem_id: number | null;
  mes_referencia: string | null;
  valor_pago: number | string | null;
  data_pagamento: string | null;
  status: string | null;
  observacoes: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

type ResumoCartao = {
  id: number;
  nome: string;
  limite: number;
  emAberto: number;
};

type ChartPoint = {
  mes: string;
  label: string;
  entradas: number;
  saidas: number;
  saldo: number;
};

type MetaResumo = {
  id?: string;
  nome: string;
  valorMeta: number;
  valorAtual: number;
  faltante: number;
  percentual: number;
  prazo: string | null;
};

type MetasSnapshot = {
  totalGuardado: number;
  quantidadeAtivas: number;
  metaMaisProxima: MetaResumo | null;
  metasOrdenadas: MetaResumo[];
};

type MetaPlanoRadar = {
  id: string;
  nome: string;
  prazo: string | null;
  faltante: number;
  valorPorDia: number;
  valorSugeridoHoje: number;
  percentual: number;
  prioridade: number;
};

type MonthSnapshot = {
  saldoInicial: number;
  entradas: number;
  saidasPagas: number;
  comprometidoMes: number;
  comprometidoAtrasado: number;
  comprometido: number;
  saldoDisponivel: number;
  adiantadas: number;
  cartoesResumo: ResumoCartao[];
};

type CardAtivo =
  | "entradas"
  | "saidas"
  | "comprometido"
  | "adiantadas"
  | "contas"
  | null;

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

type ActionFormData = {
  descricao: string;
  categoria: string;
  valor: string;
  data: string;
  tipoPagamento: PaymentType;
  cartaoId: string;
  parcelas: string;
  primeiraCobranca: string;
};

type RecomendacaoAcao = {
  tipo: "guardar_meta";
  valor: number;
  metaId: string;
  metaNome: string;
};

type RecomendacaoItem = {
  tipo: "acao" | "alerta";
  texto: string;
  acao?: RecomendacaoAcao;
};

type MetaRecord = Record<string, unknown>;
type MetaAporteRecord = Record<string, unknown>;

function getMesAtual() {
  return getMesAtualISO();
}

const getHoje = getHojeISO;

function getInitialActionForm(): ActionFormData {
  return {
    descricao: "",
    categoria: "",
    valor: "",
    data: getHojeISO(),
    tipoPagamento: "pix_dinheiro",
    cartaoId: "",
    parcelas: "1",
    primeiraCobranca: "",
  };
}

const formatarMoeda = formatarMoedaBRL;

function formatarMesExtenso(anoMes: string) {
  const [ano, mes] = anoMes.split("-");
  const nomes = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  return `${nomes[Number(mes) - 1]} de ${ano}`;
}

function adicionarMeses(anoMes: string, quantidade: number) {
  const [ano, mes] = anoMes.split("-").map(Number);
  const data = new Date(ano, mes - 1 + quantidade, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function getStringCampo(meta: MetaRecord, campos: string[], fallback = "") {
  for (const campo of campos) {
    const valor = meta[campo];
    if (typeof valor === "string" && valor.trim()) return valor.trim();
  }
  return fallback;
}

function getNumeroCampo(meta: MetaRecord, campos: string[], fallback = 0) {
  for (const campo of campos) {
    const valor = meta[campo];
    if (typeof valor === "number") return valor;
    if (
      typeof valor === "string" &&
      valor.trim() !== "" &&
      !Number.isNaN(Number(valor))
    ) {
      return Number(valor);
    }
  }
  return fallback;
}

function formatarMesCurto(anoMes: string) {
  const [ano, mes] = anoMes.split("-");
  const nomes = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  return `${nomes[Number(mes) - 1]}/${ano.slice(2)}`;
}

function formatarCompetencia(valor: string) {
  if (!valor) return "-";
  const [ano, mes] = valor.split("-");
  if (!ano || !mes) return valor;
  return `${mes}/${ano}`;
}

function formatarData(data: string | null | undefined) {
  if (!data) return "--/--/----";
  const [ano, mes, dia] = data.split("-");
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
}

function formatarTipoPagamento(tipo: string | null | undefined) {
  const normalizado = (tipo ?? "").toLowerCase();
  if (normalizado === "credito") return "Cartão de Crédito";
  if (normalizado === "debito") return "Cartão de Débito";
  if (normalizado === "pix_dinheiro") return "PIX / Dinheiro";
  return "À vista";
}

function percentualSeguro(valor: number, total: number) {
  if (total <= 0) return 0;
  return Math.min((valor / total) * 100, 100);
}

function getCardNome(cartoes: Cartao[], cartaoId: number | null | undefined) {
  if (!cartaoId) return "Cartão";
  return cartoes.find((c) => c.id === cartaoId)?.nome ?? `Cartão ${cartaoId}`;
}

function getCategoriaLabelSeguro(categoria: string | null | undefined) {
  if (!categoria) return "Sem categoria";
  return getCategoryLabel(categoria);
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

  if (dia > Number(cartao.fechamento_dia ?? 31)) {
    if (mes === 12) {
      anoCobranca = ano + 1;
      mesCobranca = 1;
    } else {
      mesCobranca = mes + 1;
    }
  }

  return `${anoCobranca}-${String(mesCobranca).padStart(2, "0")}`;
}

function getUltimoMesConta(conta: ContaFixaDashboard) {
  if (!conta.inicio_cobranca) return null;

  if (conta.tipo_recorrencia === "indeterminada") {
    return null;
  }

  if (conta.fim_cobranca) {
    return conta.fim_cobranca;
  }

  if (conta.quantidade_meses && conta.quantidade_meses > 0) {
    return adicionarMeses(conta.inicio_cobranca, conta.quantidade_meses - 1);
  }

  return null;
}

function contaExisteNoMes(conta: ContaFixaDashboard, mesReferencia: string) {
  if (!conta.inicio_cobranca) return false;

  if (conta.inicio_cobranca > mesReferencia) {
    return false;
  }

  if (conta.tipo_recorrencia === "indeterminada") {
    return true;
  }

  const ultimoMes = getUltimoMesConta(conta);
  if (!ultimoMes) return false;

  return mesReferencia >= conta.inicio_cobranca && mesReferencia <= ultimoMes;
}

function contaEstaPendenteAteMes(
  conta: ContaFixaDashboard,
  mesReferencia: string,
  pagamentosContas: PagamentoContaDashboard[]
) {
  if (conta.ativa === false) return false;
  if (!conta.inicio_cobranca) return false;
  if (conta.inicio_cobranca > mesReferencia) return false;

  if (conta.tipo_recorrencia === "temporaria") {
    const ultimoMes = getUltimoMesConta(conta);
    if (ultimoMes && ultimoMes < mesReferencia) {
      // ainda pode estar pendente se algum mês anterior não foi pago
    }
  }

const competencias: string[] = [];

  if (conta.tipo_recorrencia === "indeterminada") {
    let atual = conta.inicio_cobranca;
    while (atual <= mesReferencia) {
      competencias.push(atual);
      atual = adicionarMeses(atual, 1);
    }
  } else {
    const ultimoMes = getUltimoMesConta(conta);
    if (!ultimoMes) return false;

    let atual = conta.inicio_cobranca;
    while (atual <= mesReferencia && atual <= ultimoMes) {
      competencias.push(atual);
      atual = adicionarMeses(atual, 1);
    }
  }

  return competencias.some((competencia) => {
    const pagamento = pagamentosContas.find(
      (item) =>
        Number(item.origem_id) === conta.id &&
        item.mes_referencia === competencia &&
        (item.status ?? "").toLowerCase() === "paga"
    );

    return !pagamento;
  });
}

function getDataVencimentoConta(
  conta: ContaFixaDashboard,
  mesReferencia: string
) {
  const dia = Math.min(Math.max(Number(conta.dia_vencimento || 1), 1), 31);
  return `${mesReferencia}-${String(dia).padStart(2, "0")}`;
}

function getStatusContaDashboard(
  conta: ContaFixaDashboard,
  mesReferencia: string,
  pagamentosContas: PagamentoContaDashboard[]
) {
  const pagamento = pagamentosContas.find(
    (item) =>
      Number(item.origem_id) === conta.id &&
      item.mes_referencia === mesReferencia &&
      (item.status ?? "").toLowerCase() === "paga"
  );

  if (pagamento) {
    return {
      status: "paga" as const,
      dataVencimento: getDataVencimentoConta(conta, mesReferencia),
      pagamento,
    };
  }

  const hoje = getHoje();
  const mesAtual = hoje.slice(0, 7);
  const dataVencimento = getDataVencimentoConta(conta, mesReferencia);

  if (mesReferencia < mesAtual) {
    return {
      status: "vencida" as const,
      dataVencimento,
      pagamento: null,
    };
  }

  if (mesReferencia > mesAtual) {
    return {
      status: "futura" as const,
      dataVencimento,
      pagamento: null,
    };
  }

  if (dataVencimento < hoje) {
    return {
      status: "vencida" as const,
      dataVencimento,
      pagamento: null,
    };
  }

  if (dataVencimento === hoje) {
    return {
      status: "vence_hoje" as const,
      dataVencimento,
      pagamento: null,
    };
  }

  const diffDias = Math.ceil(
    (new Date(`${dataVencimento}T00:00:00`).getTime() -
      new Date(`${hoje}T00:00:00`).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (diffDias >= 1 && diffDias <= 3) {
    return {
      status: "vence_breve" as const,
      dataVencimento,
      pagamento: null,
    };
  }

  return {
    status: "aberta" as const,
    dataVencimento,
    pagamento: null,
  };
}

function MiniBarChart({ data }: { data: ChartPoint[] }) {
  const maxValor = Math.max(
    1,
    ...data.flatMap((item) => [item.entradas, item.saidas, Math.abs(item.saldo)])
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
        <div className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Entradas
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          Saídas
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {data.map((item) => (
          <div key={item.mes} className="flex flex-col items-center gap-3">
            <div className="flex h-52 items-end gap-1.5">
              <div
                className="w-4 rounded-t-2xl bg-emerald-500/90 transition-all"
                style={{
                  height: `${(item.entradas / maxValor) * 100}%`,
                  minHeight: item.entradas > 0 ? 10 : 0,
                }}
              />
              <div
                className="w-4 rounded-t-2xl bg-rose-500/90 transition-all"
                style={{
                  height: `${(item.saidas / maxValor) * 100}%`,
                  minHeight: item.saidas > 0 ? 10 : 0,
                }}
              />
            </div>

            <div className="text-center">
              <p className="text-xs font-medium text-zinc-700">{item.label}</p>
              <p
                className={`mt-1 text-[11px] font-medium ${
                  item.saldo >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {formatarMoeda(item.saldo)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function gerarSugestoesReceita({
  saldoProjetado,
  alertasContas,
  metas,
}: {
  saldoProjetado: number;
  alertasContas: {
    vencidas: Array<{ conta: ContaFixaDashboard }>;
    vencemHoje: Array<{ conta: ContaFixaDashboard }>;
    vencemBreve: Array<{ conta: ContaFixaDashboard }>;
    total: number;
  };
  metas: MetasSnapshot;
}) {
  const hoje = new Date();
  const ultimoDiaMes = new Date(
    hoje.getFullYear(),
    hoje.getMonth() + 1,
    0
  ).getDate();

  const diaAtual = hoje.getDate();
  const diasRestantes = Math.max(ultimoDiaMes - diaAtual + 1, 1);

  const totalVencidas = alertasContas.vencidas.reduce(
    (acc, item) => acc + normalizarNumero(item.conta.valor),
    0
  );

  const totalHoje = alertasContas.vencemHoje.reduce(
    (acc, item) => acc + normalizarNumero(item.conta.valor),
    0
  );

  const totalBreve = alertasContas.vencemBreve.reduce(
    (acc, item) => acc + normalizarNumero(item.conta.valor),
    0
  );

  const sugestoes: string[] = [];

  if (totalVencidas > 0) {
    sugestoes.push(
      `Hoje você precisa gerar ${formatarMoeda(
        totalVencidas
      )} para cobrir suas contas vencidas.`
    );
  }

  if (totalHoje > 0) {
    sugestoes.push(
      `Priorize pelo menos ${formatarMoeda(
        totalHoje
      )} hoje para não virar nova pendência.`
    );
  }

  if (saldoProjetado < 0) {
    const necessarioPorDia = Math.abs(saldoProjetado) / diasRestantes;

    sugestoes.push(
      `Se fizer ${formatarMoeda(
        necessarioPorDia
      )} por dia nos próximos ${diasRestantes} dia(s), você evita fechar o mês no negativo.`
    );
  }

  if (totalBreve > 0) {
    sugestoes.push(
      `Você tem ${formatarMoeda(
        totalBreve
      )} vencendo em breve. Antecipar receita agora reduz pressão nos próximos dias.`
    );
  }

  if (saldoProjetado > 0 && metas.metaMaisProxima) {
    const valorMeta = Math.min(saldoProjetado, metas.metaMaisProxima.faltante);

    sugestoes.push(
      `Depois de cobrir o urgente, você pode direcionar até ${formatarMoeda(
        valorMeta
      )} para a meta "${metas.metaMaisProxima.nome}".`
    );
  }

  if (sugestoes.length === 0) {
    sugestoes.push("Hoje sua operação está estável. Mantenha o ritmo de receita.");
  }

  return sugestoes;
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
                {formatarMoeda(item.valor)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalResumoDashboard({
  titulo,
  subtitulo,
  itens,
  busca,
  setBusca,
  onClose,
}: {
  titulo: string;
  subtitulo: string;
  itens: ModalLancamentoItem[];
  busca: string;
  setBusca: (value: string) => void;
  onClose: () => void;
}) {
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
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {subtitulo}
              </p>
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

function calcularSaldoInicialMes(
  mesSelecionado: string,
  movimentacoes: Movimentacao[],
  faturasPagamento: FaturaPagamento[],
  cartoes: Cartao[],
  contas: ContaFixaDashboard[],
  pagamentosContas: PagamentoContaDashboard[]
) {
  const mesAnterior = adicionarMeses(mesSelecionado, -1);

  const snapMesAnterior = calcularSnapshotDoMesBase(
    mesAnterior,
    movimentacoes,
    faturasPagamento,
    cartoes,
    contas,
    pagamentosContas
  );

  return snapMesAnterior.entradas - snapMesAnterior.saidasPagas;
}

function calcularSnapshotDoMesBase(
  mesSelecionado: string,
  movimentacoes: Movimentacao[],
  faturasPagamento: FaturaPagamento[],
  cartoes: Cartao[],
  contas: ContaFixaDashboard[],
  pagamentosContas: PagamentoContaDashboard[]
): MonthSnapshot {
  const [ano, mes] = mesSelecionado.split("-").map(Number);
  const inicioMes = `${mesSelecionado}-01`;
  const proximoMes =
    mes === 12
      ? `${ano + 1}-01-01`
      : `${ano}-${String(mes + 1).padStart(2, "0")}-01`;

  const movimentacoesMes = movimentacoes.filter((item) => {
    const data = item.data ?? "";
    return data >= inicioMes && data < proximoMes;
  });

  const entradas = movimentacoesMes.filter(
    (item) => (item.tipo ?? "").toLowerCase() === "entrada"
  );

  const despesasAvista = movimentacoesMes.filter(
    (item) =>
      (item.tipo ?? "").toLowerCase() === "despesa" &&
      (item.tipo_pagamento ?? "").toLowerCase() !== "credito"
  );

  const totalEntradas = entradas.reduce(
    (acc, item) => acc + normalizarNumero(item.valor),
    0
  );

  const totalDespesasAvista = despesasAvista.reduce(
    (acc, item) => acc + normalizarNumero(item.valor),
    0
  );

  const movimentacoesCredito = movimentacoes.filter(
    (item) =>
      (item.tipo ?? "").toLowerCase() === "despesa" &&
      (item.tipo_pagamento ?? "").toLowerCase() === "credito" &&
      !!item.cartao_id
  );

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

  let totalFaturasPagasNoMes = 0;
  let totalFaturasEmAbertoMes = 0;
  let totalFaturasEmAbertoAtrasadas = 0;
  let totalAdiantadasNoMes = 0;

  const resumoPorCartao = new Map<number, ResumoCartao>();

  for (const cartao of cartoes) {
    resumoPorCartao.set(cartao.id, {
      id: cartao.id,
      nome: cartao.nome,
      limite: normalizarNumero(cartao.limite),
      emAberto: 0,
    });
  }

  for (const [chave, valorFatura] of faturasProjetadas.entries()) {
    const [cartaoIdStr, competencia] = chave.split("|");
    const cartaoId = Number(cartaoIdStr);

    const pagamento = faturasPagamento.find(
      (item) =>
        item.cartao_id === cartaoId &&
        item.mes_referencia === competencia &&
        (item.status ?? "").toLowerCase() === "paga"
    );

    if (!pagamento) {
      if (competencia < mesSelecionado) {
        totalFaturasEmAbertoAtrasadas += valorFatura;
      } else if (competencia === mesSelecionado) {
        totalFaturasEmAbertoMes += valorFatura;
      }

      const resumo = resumoPorCartao.get(cartaoId);
      if (resumo) resumo.emAberto += valorFatura;
      continue;
    }

    const mesPagamento = pagamento.data_pagamento?.slice(0, 7);

    if (mesPagamento === mesSelecionado) {
      const valorPago = normalizarNumero(pagamento.valor_pago || valorFatura);
      totalFaturasPagasNoMes += valorPago;

      if (competencia > mesSelecionado) {
        totalAdiantadasNoMes += valorPago;
      }
    } else {
      const resumo = resumoPorCartao.get(cartaoId);
      if (resumo && competencia <= mesSelecionado) {
        resumo.emAberto += valorFatura;
      }
    }
  }

  let totalContasPagasNoMes = 0;
  let totalContasEmAbertoMes = 0;
  let totalContasEmAbertoAtrasadas = 0;

  const contasAtivas = contas.filter((conta) => conta.ativa !== false);

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
    const ultimoMes = getUltimoMesConta(conta);
    if (!ultimoMes) continue;

    let atual = conta.inicio_cobranca;
    while (atual <= mesSelecionado && atual <= ultimoMes) {
      competencias.push(atual);
      atual = adicionarMeses(atual, 1);
    }
  }

  for (const competencia of competencias) {
    const pagamento = pagamentosContas.find(
      (item) =>
        Number(item.origem_id) === conta.id &&
        item.mes_referencia === competencia &&
        (item.status ?? "").toLowerCase() === "paga"
    );

    const valorConta = normalizarNumero(conta.valor);

    if (!pagamento) {
      if (competencia < mesSelecionado) {
        totalContasEmAbertoAtrasadas += valorConta;
      } else if (competencia === mesSelecionado) {
        totalContasEmAbertoMes += valorConta;
      }
      continue;
    }

    const mesPagamento = pagamento.data_pagamento?.slice(0, 7);

    if (mesPagamento === mesSelecionado) {
      totalContasPagasNoMes += normalizarNumero(
        pagamento.valor_pago || valorConta
      );
    }
  }
}
  const totalSaidasPagas =
    totalDespesasAvista + totalFaturasPagasNoMes + totalContasPagasNoMes;

  const comprometidoMes =
    totalFaturasEmAbertoMes + totalContasEmAbertoMes;

  const comprometidoAtrasado =
    totalFaturasEmAbertoAtrasadas + totalContasEmAbertoAtrasadas;

  const totalComprometido = comprometidoMes + comprometidoAtrasado;

  return {
    saldoInicial: 0,
    entradas: totalEntradas,
    saidasPagas: totalSaidasPagas,
    comprometidoMes,
    comprometidoAtrasado,
    comprometido: totalComprometido,
    saldoDisponivel: totalEntradas - totalSaidasPagas,
    adiantadas: totalAdiantadasNoMes,
    cartoesResumo: Array.from(resumoPorCartao.values()),
  };
}

function calcularSnapshotDoMes(
  mesSelecionado: string,
  movimentacoes: Movimentacao[],
  faturasPagamento: FaturaPagamento[],
  cartoes: Cartao[],
  contas: ContaFixaDashboard[],
  pagamentosContas: PagamentoContaDashboard[]
): MonthSnapshot {
  const base = calcularSnapshotDoMesBase(
    mesSelecionado,
    movimentacoes,
    faturasPagamento,
    cartoes,
    contas,
    pagamentosContas
  );

  const saldoInicial = calcularSaldoInicialMes(
    mesSelecionado,
    movimentacoes,
    faturasPagamento,
    cartoes,
    contas,
    pagamentosContas
  );

  const saldoDisponivel = saldoInicial + base.entradas - base.saidasPagas;

  return {
    ...base,
    saldoInicial,
    saldoDisponivel,
  };
}

function formatarPrazoCurto(data: string | null) {
  if (!data) return "Sem prazo";
  if (/^\d{4}-\d{2}$/.test(data)) return formatarCompetencia(data);
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return formatarData(data);
  return data;
}


function getDataPrazoMeta(prazo: string | null) {
  if (!prazo) return null;

  if (/^\d{4}-\d{2}$/.test(prazo)) {
    const [ano, mes] = prazo.split("-").map(Number);
    return new Date(ano, mes, 0);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(prazo)) {
    return new Date(`${prazo}T23:59:59`);
  }

  return null;
}

function calcularPlanoMeta(meta: MetaResumo, saldoDisponivel: number, prioridade: number): MetaPlanoRadar | null {
  if (!meta.id || meta.faltante <= 0) return null;

  const dataPrazo = getDataPrazoMeta(meta.prazo);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diasAtePrazo = dataPrazo
    ? Math.max(
        Math.ceil((dataPrazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)),
        1
      )
    : 30;

  const valorPorDia = meta.faltante / diasAtePrazo;
  const multiplicadorPrioridade = prioridade === 1 ? 1.25 : prioridade === 2 ? 1 : 0.85;
  const valorSugeridoHoje = saldoDisponivel > 0
    ? Math.min(meta.faltante, Math.max(valorPorDia * multiplicadorPrioridade, valorPorDia))
    : 0;

  return {
    id: meta.id,
    nome: meta.nome,
    prazo: meta.prazo,
    faltante: meta.faltante,
    valorPorDia,
    valorSugeridoHoje,
    percentual: meta.percentual,
    prioridade,
  };
}

function gerarInsights({
  entradas,
  saidas,
  comprometido,
  saldo,
  metas,
}: {
  entradas: number;
  saidas: number;
  comprometido: number;
  saldo: number;
  metas: MetasSnapshot;
}) {
  const insights: {
    tipo: "alerta" | "positivo" | "neutro";
    texto: string;
  }[] = [];

  const usoTotal = saidas + comprometido;

  if (usoTotal > entradas) {
    insights.push({
      tipo: "alerta",
      texto: `Você já comprometeu mais do que ganhou este mês.`,
    });
  }

  if (saldo > 0 && metas.metaMaisProxima) {
    insights.push({
      tipo: "positivo",
      texto: `Você pode aportar até ${formatarMoeda(
        saldo
      )} na meta "${metas.metaMaisProxima.nome}".`,
    });
  }

  if (saidas === 0 && comprometido > 0) {
    insights.push({
      tipo: "neutro",
      texto: `Você ainda não teve saídas reais, mas já possui valores comprometidos.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      tipo: "neutro",
      texto: `Seu mês está equilibrado até agora.`,
    });
  }

  return insights;
}

function gerarPrevisao({
  entradas,
  saidas,
  comprometido,
}: {
  entradas: number;
  saidas: number;
  comprometido: number;
}) {
  const hoje = new Date();
  const diaAtual = hoje.getDate();

  const ultimoDiaMes = new Date(
    hoje.getFullYear(),
    hoje.getMonth() + 1,
    0
  ).getDate();

  const diasRestantes = Math.max(ultimoDiaMes - diaAtual + 1, 1);

  const gastoDiarioAtual = diaAtual > 0 ? saidas / diaAtual : 0;

  // projeção conservadora: o que ainda falta pagar + ritmo atual de gasto real
  const previsaoSaidasReaisRestantes = gastoDiarioAtual * diasRestantes;
  const saldoFinalPrevisto =
    entradas - saidas - comprometido - previsaoSaidasReaisRestantes;

  const gastoDiarioPermitido =
    diasRestantes > 0
      ? (entradas - saidas - comprometido) / diasRestantes
      : 0;

  return {
    saldoFinalPrevisto,
    gastoDiarioAtual,
    gastoDiarioPermitido,
    diasRestantes,
  };
}

function calcularValorAtualMetaDashboard(
  meta: Record<string, unknown>,
  aportes: Record<string, unknown>[]
) {
  const valorInicial = getNumeroCampo(meta, ["valor_inicial"], 0);
  const valorAtualBase = getNumeroCampo(
    meta,
    ["valor_atual", "valor_guardado", "guardado", "saved_amount", "valor"],
    0
  );

  const base = valorAtualBase > 0 ? valorAtualBase : valorInicial;

  const totalHistorico = aportes.reduce((acc, item) => {
    const valor = getNumeroCampo(item, ["valor"], 0);
    const tipo = getStringCampo(item, ["tipo"], "").toLowerCase();

    if (tipo === "aporte") return acc + valor;
    if (tipo === "retirada") return acc - valor;
    if (tipo === "ajuste") return acc + valor;

    return acc;
  }, 0);

  return base + totalHistorico;
}

function calcularMetasSnapshotComAportes(
  metasRaw: Record<string, unknown>[],
  aportesRaw: Record<string, unknown>[]
): MetasSnapshot {
  const metas = metasRaw
    .filter((meta) => {
      const status = getStringCampo(meta, ["status"], "ativa").toLowerCase();
      const considerar =
        typeof meta.considerar_na_dashboard === "boolean"
          ? meta.considerar_na_dashboard
          : true;

      return status === "ativa" && considerar;
    })
    .map((meta, index) => {
      const metaId = getStringCampo(meta, ["id"], "");
      const aportesDaMeta = aportesRaw.filter(
        (item) => getStringCampo(item, ["meta_id"], "") === metaId
      );

      const nome =
        getStringCampo(meta, ["nome", "titulo", "descricao"], `Meta ${index + 1}`) ||
        `Meta ${index + 1}`;

      const valorMeta = Math.max(
        getNumeroCampo(meta, [
          "valor_meta",
          "valor_alvo",
          "meta",
          "objetivo",
          "target_amount",
        ]),
        0
      );

      const valorAtual = Math.max(
        calcularValorAtualMetaDashboard(meta, aportesDaMeta),
        0
      );

      const prazo =
        getStringCampo(meta, ["prazo", "data_limite", "deadline"], "") || null;

      const faltante = Math.max(valorMeta - valorAtual, 0);
      const percentual =
        valorMeta > 0 ? Math.min((valorAtual / valorMeta) * 100, 100) : 0;

      return {
        id: metaId,
        nome,
        valorMeta,
        valorAtual,
        faltante,
        percentual,
        prazo,
      };
    })
    .filter((meta) => meta.valorMeta > 0 || meta.valorAtual > 0);

  const totalGuardado = metas.reduce((acc, meta) => acc + meta.valorAtual, 0);

  const metasOrdenadas = [...metas]
    .filter((meta) => meta.faltante > 0)
    .sort((a, b) => {
      const aTemPrazo = Boolean(a.prazo);
      const bTemPrazo = Boolean(b.prazo);

      if (aTemPrazo && !bTemPrazo) return -1;
      if (!aTemPrazo && bTemPrazo) return 1;

      if (a.prazo && b.prazo && a.prazo !== b.prazo) {
        return a.prazo.localeCompare(b.prazo);
      }

      return a.faltante - b.faltante;
    });

  return {
    totalGuardado,
    quantidadeAtivas: metas.length,
    metaMaisProxima: metasOrdenadas[0] ?? null,
    metasOrdenadas,
  };
}

function gerarRecomendacoes({
  saldo,
  previsao,
  metas,
}: {
  saldo: number;
  previsao: ReturnType<typeof gerarPrevisao>;
  metas: MetasSnapshot;
}): RecomendacaoItem[] {
  const recomendacoes: RecomendacaoItem[] = [];

  if (previsao.saldoFinalPrevisto < 0) {
    const deficit = Math.abs(previsao.saldoFinalPrevisto);

    recomendacoes.push({
      tipo: "alerta",
      texto: `Você precisa reduzir cerca de ${formatarMoeda(
        deficit / (previsao.diasRestantes || 1)
      )} por dia para não fechar o mês negativo.`,
    });
  }

  if (saldo > 0 && metas.metaMaisProxima?.id) {
    const valorSugerido = Number((saldo * 0.5).toFixed(2));

    recomendacoes.push({
      tipo: "acao",
      texto: `Você pode guardar ${formatarMoeda(
        valorSugerido
      )} hoje na meta "${metas.metaMaisProxima.nome}".`,
      acao: {
        tipo: "guardar_meta",
        valor: valorSugerido,
        metaId: metas.metaMaisProxima.id,
        metaNome: metas.metaMaisProxima.nome,
      },
    });
  }

  if (saldo > 0 && previsao.saldoFinalPrevisto > 0) {
    recomendacoes.push({
      tipo: "acao",
      texto: `Você está em um bom ritmo. Continue mantendo seus gastos controlados.`,
    });
  }

  if (recomendacoes.length === 0) {
    recomendacoes.push({
      tipo: "acao",
      texto: `Sem ações necessárias agora.`,
    });
  }

  return recomendacoes;
}

function ModalLancamentoDashboard({
  open,
  onClose,
  onSave,
  formType,
  setFormType,
  formData,
  setFormData,
  cartoes,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => Promise<void>;
  formType: FormType;
  setFormType: (value: FormType) => void;
  formData: ActionFormData;
  setFormData: React.Dispatch<React.SetStateAction<ActionFormData>>;
  cartoes: Cartao[];
  saving: boolean;
}) {
  const categoriasAtuais = getCategoryOptions(formType);

  const primeiraCobrancaSugerida = useMemo(() => {
    if (formType !== "despesa") return "";
    if (formData.tipoPagamento !== "credito") return "";
    if (!formData.data || !formData.cartaoId) return "";

    return calcularPrimeiraCobranca(
      formData.data,
      Number(formData.cartaoId),
      cartoes
    );
  }, [cartoes, formData.cartaoId, formData.data, formData.tipoPagamento, formType]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-80 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-90 flex items-center justify-center p-4">
        <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-sm font-medium text-slate-500">Novo lançamento</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900">
                {formType === "entrada" ? "Nova entrada" : "Nova despesa"}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={onSave} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">Tipo</label>
                    <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setFormType("entrada")}
                        className={
                          formType === "entrada"
                            ? "flex-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm"
                            : "flex-1 rounded-lg px-4 py-2 text-sm font-medium text-slate-600"
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
                            : "flex-1 rounded-lg px-4 py-2 text-sm font-medium text-slate-600"
                        }
                      >
                        Despesa
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Descrição</label>
                    <input
                      type="text"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, descricao: e.target.value }))
                      }
                      className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-700">Valor</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.valor}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, valor: e.target.value }))
                        }
                        className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-slate-700">Data</label>
                      <input
                        type="date"
                        value={formData.data}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, data: e.target.value }))
                        }
                        className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700">Categoria</label>
                    <select
                      value={formData.categoria}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, categoria: e.target.value }))
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
                            cartaoId: e.target.value === "credito" ? prev.cartaoId : "",
                            parcelas: e.target.value === "credito" ? prev.parcelas : "1",
                            primeiraCobranca:
                              e.target.value === "credito" ? prev.primeiraCobranca : "",
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
                          <label className="text-sm font-medium text-slate-700">Cartão</label>
                          <select
                            value={formData.cartaoId}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, cartaoId: e.target.value }))
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
                            <label className="text-sm font-medium text-slate-700">Parcelas</label>
                            <input
                              type="number"
                              min="1"
                              value={formData.parcelas}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, parcelas: e.target.value }))
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
                              value={formData.primeiraCobranca || primeiraCobrancaSugerida}
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
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#f6f8fb] px-6 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-44 animate-pulse rounded-3xl bg-zinc-200/80" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="h-36 animate-pulse rounded-3xl bg-zinc-200/80" />
          <div className="h-36 animate-pulse rounded-3xl bg-zinc-200/80" />
          <div className="h-36 animate-pulse rounded-3xl bg-zinc-200/80" />
          <div className="h-36 animate-pulse rounded-3xl bg-zinc-200/80" />
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="h-56 animate-pulse rounded-3xl bg-zinc-200/80" />
          <div className="h-56 animate-pulse rounded-3xl bg-zinc-200/80" />
        </div>
      </div>
    </div>
  );
}

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
      console.error("Erro auth:", authError);
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
    ] = await Promise.all([
      supabase
        .from("movimentacoes")
        .select(
          "id, created_at, tipo, descricao, categoria, valor, data, tipo_pagamento, cartao_id, parcelas, primeira_cobranca, meta_id, meta_aporte_id"
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
    ]);

    if (movimentacoesError) console.error("Erro movimentações:", movimentacoesError);
    if (faturasPagamentoError) console.error("Erro faturas_pagamento:", faturasPagamentoError);
    if (cartoesError) console.error("Erro cartoes:", cartoesError);
    if (contasError) console.error("Erro contas_fixas:", contasError);
    if (pagamentosContasError) {
      console.error("Erro pagamentos_contas:", pagamentosContasError);
    }
    if (metaAportesError) console.error("Erro meta_aportes:", metaAportesError);

    if (metasError || metaAportesError) {
      console.warn("Aviso metas:", metasError || metaAportesError);
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
    const ultimoMes = getUltimoMesConta(conta);
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
        console.error("Erro ao registrar aporte:", aporteError);
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
        console.error("Erro ao registrar despesa da meta:", movimentacaoError);
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
      console.error("Erro ao pagar conta:", error);
      alert(`Erro ao pagar conta: ${error.message}`);
      return;
    }

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
      console.error("Erro ao salvar movimentação:", error);
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

              <div className="grid gap-3 sm:grid-cols-2 xl:w-full xl:max-w-140">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 sm:col-span-2">
                  <p className="text-3xl font-bold text-emerald-700">
                    Saldo real em conta
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-emerald-700">
                    {formatarMoeda(saldoDisponivel)}
                  </p>
                  <p className="mt-2 text-xs text-emerald-700/80">
                    Dinheiro real disponível considerando o fechamento do mês anterior.
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
                    Saídas reais
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-900">
                    {formatarMoeda(saidasPagasMes)}
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

        <section className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Inteligência do mês</h2>
            <p className="mt-1 text-sm text-zinc-500">
              O essencial para decidir o que fazer agora, sem poluição visual.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-zinc-900">Situação do mês</h3>

              {insights.map((item, i) => {
                const estilo =
                  item.tipo === "alerta"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : item.tipo === "positivo"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-zinc-200 bg-zinc-50 text-zinc-700";

                return (
                  <div
                    key={`insight-${i}`}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium ${estilo}`}
                  >
                    {item.texto}
                  </div>
                );
              })}

              <div
                className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                  previsao.saldoFinalPrevisto < 0
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {previsao.saldoFinalPrevisto < 0
                  ? `Se continuar assim, você fechará o mês com ${formatarMoeda(
                      previsao.saldoFinalPrevisto
                    )}`
                  : `Você terminará o mês com aproximadamente ${formatarMoeda(
                      previsao.saldoFinalPrevisto
                    )}`}
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                Gasto médio diário: <strong>{formatarMoeda(previsao.gastoDiarioAtual)}</strong>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-semibold text-zinc-900">Próximas ações</h3>

              {recomendacoes.map((item, i) => {
                const estilo =
                  item.tipo === "alerta"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700";

                return (
                  <div
                    key={`acao-${i}`}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium ${estilo}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{item.texto}</span>
                      {item.acao ? (
                        <button
                          type="button"
                          onClick={() => executarAcao(item.acao!)}
                          className="shrink-0 rounded-xl bg-black px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                        >
                          Guardar agora
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {sugestoesReceita.slice(0, 2).map((texto, index) => (
                <div
                  key={`sugestao-${index}`}
                  className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700"
                >
                  {texto}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-zinc-900">Alertas de contas</h3>

            {alertasContas.total === 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                Nenhuma conta crítica no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {alertasContas.vencidas.map((item) => (
                  <div
                    key={`vencida-${item.conta.id}`}
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-red-700">
                          Conta vencida • {item.conta.descricao}
                        </p>
                        <p className="mt-1 text-sm text-red-600">
                          Venceu em {formatarData(item.dataVencimento)} • {formatarMoeda(normalizarNumero(item.conta.valor))}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          className="rounded-xl bg-black px-3 py-1.5 text-xs text-white"
                          onClick={() => pagarContaDashboard(item.conta)}
                        >
                          Pagar
                        </button>
                        <Link
                          href="/contas"
                          className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Ver em Contas
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {alertasContas.vencemHoje.map((item) => (
                  <div
                    key={`hoje-${item.conta.id}`}
                    className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-amber-700">
                          Conta vence hoje • {item.conta.descricao}
                        </p>
                        <p className="mt-1 text-sm text-amber-600">
                          Vencimento em {formatarData(item.dataVencimento)} • {formatarMoeda(normalizarNumero(item.conta.valor))}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          className="rounded-xl bg-black px-3 py-1.5 text-xs text-white"
                          onClick={() => pagarContaDashboard(item.conta)}
                        >
                          Pagar
                        </button>
                        <Link
                          href="/contas"
                          className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Ver em Contas
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {alertasContas.vencemBreve.map((item) => (
                  <div
                    key={`breve-${item.conta.id}`}
                    className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-blue-700">
                          Conta vencendo em breve • {item.conta.descricao}
                        </p>
                        <p className="mt-1 text-sm text-blue-600">
                          Vence em {formatarData(item.dataVencimento)} • {formatarMoeda(normalizarNumero(item.conta.valor))}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          className="rounded-xl bg-black px-3 py-1.5 text-xs text-white"
                          onClick={() => pagarContaDashboard(item.conta)}
                        >
                          Pagar
                        </button>
                        <Link
                          href="/contas"
                          className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Ver em Contas
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

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