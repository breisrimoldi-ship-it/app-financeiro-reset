import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TIPO_RV_LABEL, parseTipoFromDescricao,  type TipoRvLancamento, } from "./_lib/tipos";
import {
  ArrowRightLeft,
  AlertTriangle,
  Plus,
  Settings2,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Clock3,
  Sparkles,
  Pencil,
  Trash2,
  CalendarRange,
} from "lucide-react";

type LancamentoRow = {
  id: string;
  data: string;
  descricao: string;
  perfil: string | null;
  valor_recebido: number | null;
  custo_total: number | null;
  lucro_liquido: number | null;
  lucro_por_hora: number | null;
};

type TransferenciaRow = {
  valor: number | null;
};

type LancamentoHistoricoRow = {
  data: string;
  descricao: string;
  valor_recebido: number | null;
  custo_total: number | null;
};

type TransferenciaHistoricoRow = {
  data_transferencia: string;
  valor: number | null;
};

type SerieMensal = {
  mes: string;
  receitas: number;
  aportes: number;
  custos: number;
  transferencias: number;
  lucroLiquido: number;
};

function formatMoney(value: number) {
  return value.toFixed(2);
}

function formatDate(value: string) {
  if (!value) return "—";

  const [ano, mes, dia] = value.split("-");
  if (!ano || !mes || !dia) return value;

  return `${dia}/${mes}/${ano}`;
}

function getMesAtual() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
}

function getRangeFromMes(mes: string) {
  const [ano, mesNumero] = mes.split("-").map(Number);

  const inicio = new Date(ano, mesNumero - 1, 1);
  const fim = new Date(ano, mesNumero, 0);

  return {
    inicioStr: inicio.toISOString().slice(0, 10),
    fimStr: fim.toISOString().slice(0, 10),
  };
}

function formatCompetenciaLabel(mes: string) {
  const [ano, mesNumero] = mes.split("-");
  if (!ano || !mesNumero) return mes;
  return `${mesNumero}/${ano}`;
}

function getMesAnterior(mes: string) {
  const [ano, mesNumero] = mes.split("-").map(Number);

  if (!ano || !mesNumero) return getMesAtual();

  const referencia = new Date(ano, mesNumero - 1, 1);
  referencia.setMonth(referencia.getMonth() - 1);

  return `${referencia.getFullYear()}-${String(referencia.getMonth() + 1).padStart(2, "0")}`;
}

function formatDelta(valorAtual: number, valorAnterior: number) {
  const diferenca = valorAtual - valorAnterior;
  const base = Math.abs(valorAnterior);
  const percentual = base > 0 ? (diferenca / base) * 100 : null;

  return {
    diferenca,
    percentual,
    isPositivo: diferenca >= 0,
  };
}

function getUltimosMeses(referencia: string, quantidade: number) {
  const [ano, mes] = referencia.split("-").map(Number);
  const base = new Date(ano, mes - 1, 1);
  const meses: string[] = [];

  for (let i = quantidade - 1; i >= 0; i -= 1) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  return meses;
}

function getRangeFromMeses(meses: string[]) {
  const primeiro = meses[0];
  const ultimo = meses[meses.length - 1];
  const inicio = `${primeiro}-01`;

  const [anoFim, mesFim] = ultimo.split("-").map(Number);
  const ultimoDia = new Date(anoFim, mesFim, 0).getDate();
  const fim = `${ultimo}-${String(ultimoDia).padStart(2, "0")}`;

  return { inicio, fim };
}

type FiltroTipo = "todos" | TipoRvLancamento;

type PageProps = {
  searchParams?: Promise<{
    mes?: string;
    tipo?: FiltroTipo;
    meta?: string;
  }>;
};

export default async function RendaVariavelPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const mesSelecionado = resolvedSearchParams.mes || getMesAtual();
  const tipoSelecionado = resolvedSearchParams.tipo || "todos";
  const metaParam = Number(resolvedSearchParams.meta ?? "");

  const supabase = await createClient();

  async function excluirLancamento(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");

    if (!id) return;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("rv_lancamentos")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/renda-variavel");
    revalidatePath("/dashboard");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { inicioStr, fimStr } = getRangeFromMes(mesSelecionado);
  const mesAnterior = getMesAnterior(mesSelecionado);
  const { inicioStr: inicioAnterior, fimStr: fimAnterior } = getRangeFromMes(mesAnterior);

  const { data: lancamentosMes, error: erroMes } = await supabase
    .from("rv_lancamentos")
    .select(
      "id, data, descricao, perfil, valor_recebido, custo_total, lucro_liquido, lucro_por_hora"
    )
    .eq("user_id", user.id)
    .gte("data", inicioStr)
    .lte("data", fimStr)
    .order("data", { ascending: false });

  if (erroMes) {
    throw new Error(erroMes.message);
  }

    const { data: lancamentosMesAnterior, error: erroMesAnterior } = await supabase
    .from("rv_lancamentos")
    .select("descricao, valor_recebido, custo_total")
    .eq("user_id", user.id)
    .gte("data", inicioAnterior)
    .lte("data", fimAnterior);

  if (erroMesAnterior) {
    throw new Error(erroMesAnterior.message);
  }

  const { data: transferenciasMes, error: erroTransferencias } = await supabase
    .from("rv_transferencias")
    .select("valor")
    .eq("user_id", user.id)
    .gte("data_transferencia", inicioStr)
    .lte("data_transferencia", fimStr);

  if (erroTransferencias) {
    throw new Error(erroTransferencias.message);
  }

    const { data: transferenciasMesAnterior, error: erroTransferenciasAnterior } = await supabase
    .from("rv_transferencias")
    .select("valor")
    .eq("user_id", user.id)
    .gte("data_transferencia", inicioAnterior)
    .lte("data_transferencia", fimAnterior);

  if (erroTransferenciasAnterior) {
    throw new Error(erroTransferenciasAnterior.message);
  }


  const { data: lancamentosRecentes, error: erroRecentes } = await supabase
    .from("rv_lancamentos")
    .select(
      "id, data, descricao, perfil, valor_recebido, custo_total, lucro_liquido, lucro_por_hora"
    )
    .eq("user_id", user.id)
    .order("data", { ascending: false })
    .limit(10);

  if (erroRecentes) {
    throw new Error(erroRecentes.message);
  }

  const listaMes = (lancamentosMes ?? []) as LancamentoRow[];
  const listaMesAnterior = (lancamentosMesAnterior ?? []) as Pick<
    LancamentoRow,
    "descricao" | "valor_recebido" | "custo_total"
  >[];
  const listaRecentes = (lancamentosRecentes ?? []) as LancamentoRow[];
  const listaTransferencias = (transferenciasMes ?? []) as TransferenciaRow[];
  const listaTransferenciasMesAnterior = (transferenciasMesAnterior ?? []) as TransferenciaRow[];

  const mesesHistorico = getUltimosMeses(mesSelecionado, 12);
const { inicio: inicioHistorico, fim: fimHistorico } = getRangeFromMeses(mesesHistorico);

const { data: lancamentosHistorico, error: erroHistoricoLancamentos } = await supabase
  .from("rv_lancamentos")
  .select("data, descricao, valor_recebido, custo_total")
  .eq("user_id", user.id)
  .gte("data", inicioHistorico)
  .lte("data", fimHistorico);

if (erroHistoricoLancamentos) {
  throw new Error(erroHistoricoLancamentos.message);
}

const { data: transferenciasHistorico, error: erroHistoricoTransferencias } = await supabase
  .from("rv_transferencias")
  .select("data_transferencia, valor")
  .eq("user_id", user.id)
  .gte("data_transferencia", inicioHistorico)
  .lte("data_transferencia", fimHistorico);

if (erroHistoricoTransferencias) {
  throw new Error(erroHistoricoTransferencias.message);
}

  const transferidoMesLegado = listaTransferencias.reduce(
  (acc, item) => acc + Number(item.valor ?? 0),
  0
);

const totais = {
  receitas: 0,
  aportes: 0,
  custos: 0,
  transferencias: 0,
};

const totaisMesAnterior = {
  receitas: 0,
  aportes: 0,
  custos: 0,
  transferencias: 0,
};


for (const item of listaMes) {
  const tipo = parseTipoFromDescricao(item.descricao ?? "");
  const recebido = Number(item.valor_recebido ?? 0);
  const custo = Number(item.custo_total ?? 0);

  if (tipo === "receita_bruta") totais.receitas += recebido;
  else if (tipo === "aporte_cpf_para_pj") totais.aportes += recebido;
  else if (tipo === "transferencia_para_cpf") totais.transferencias += custo;
  else if (tipo === "taxa_financeira" || tipo === "despesa_operacional") totais.custos += custo;
}

  for (const item of listaMesAnterior) {
  const tipo = parseTipoFromDescricao(item.descricao ?? "");
  const recebido = Number(item.valor_recebido ?? 0);
  const custo = Number(item.custo_total ?? 0);

  if (tipo === "receita_bruta") totaisMesAnterior.receitas += recebido;
  else if (tipo === "aporte_cpf_para_pj") totaisMesAnterior.aportes += recebido;
  else if (tipo === "transferencia_para_cpf") totaisMesAnterior.transferencias += custo;
  else if (tipo === "taxa_financeira" || tipo === "despesa_operacional") totaisMesAnterior.custos += custo;
}

const lucroLiquidoMes =
  totais.receitas + totais.aportes - totais.custos - totais.transferencias;
    const transferidoMesAnteriorLegado = listaTransferenciasMesAnterior.reduce(
    (acc, item) => acc + Number(item.valor ?? 0),
    0
  );
  const lucroLiquidoMesAnterior =
    totaisMesAnterior.receitas +
    totaisMesAnterior.aportes -
    totaisMesAnterior.custos -
    totaisMesAnterior.transferencias;
  const transferenciasTotaisMes =
    totais.transferencias + transferidoMesLegado;
  const transferenciasTotaisMesAnterior =
    totaisMesAnterior.transferencias + transferidoMesAnteriorLegado;

const mediaPorLancamento =
  listaMes.length > 0 ? lucroLiquidoMes / listaMes.length : 0;

  const totalHorasEstimadas = listaMes.reduce((acc, item) => {
    const lucro = Number(item.lucro_liquido ?? 0);
    const lucroHora = Number(item.lucro_por_hora ?? 0);

    if (lucro > 0 && lucroHora > 0) {
      return acc + lucro / lucroHora;
    }

    return acc;
  }, 0);

  const lucroPorHora =
    totalHorasEstimadas > 0 ? lucroLiquidoMes / totalHorasEstimadas : 0;

  const [anoAtual, mesAtual] = getMesAtual().split("-").map(Number);
  const [anoSelecionado, mesSelecionadoNumero] = mesSelecionado
    .split("-")
    .map(Number);

  const isMesAtual =
    anoAtual === anoSelecionado && mesAtual === mesSelecionadoNumero;

  const agora = new Date();
  const diaAtual = agora.getDate();
  const ultimoDiaDoMes = new Date(
    anoSelecionado,
    mesSelecionadoNumero,
    0
  ).getDate();

  const projecaoMes =
    isMesAtual && diaAtual > 0
      ? (lucroLiquidoMes / diaAtual) * ultimoDiaDoMes
      : lucroLiquidoMes;

  const resumo = {
  saldoCarteira: Math.max(lucroLiquidoMes, 0),
  recebidoMes: totais.receitas,
  aportesMes: totais.aportes,
  custosMes: totais.custos,
  lucroLiquidoMes,
  transferidoMes: transferenciasTotaisMes,
  totalHorasEstimadas,
  mediaPorLancamento,
  lucroPorHora,
  projecaoMes,
};

  const comparativo = {
    receitas: formatDelta(totais.receitas, totaisMesAnterior.receitas),
    aportes: formatDelta(totais.aportes, totaisMesAnterior.aportes),
    custos: formatDelta(totais.custos, totaisMesAnterior.custos),
    transferencias: formatDelta(transferenciasTotaisMes, transferenciasTotaisMesAnterior),
    lucroLiquido: formatDelta(lucroLiquidoMes, lucroLiquidoMesAnterior),
  };

  const transferenciaAcimaDoSaldo = transferenciasTotaisMes > lucroLiquidoMes;
  const metaMensal =
  Number.isFinite(metaParam) && metaParam > 0
    ? metaParam
    : Math.max(lucroLiquidoMesAnterior, 0);

const progressoMeta = metaMensal > 0 ? (lucroLiquidoMes / metaMensal) * 100 : 0;
const faltaParaMeta = Math.max(metaMensal - lucroLiquidoMes, 0);
const excedenteMeta = Math.max(lucroLiquidoMes - metaMensal, 0);

const diasRestantes = isMesAtual ? Math.max(ultimoDiaDoMes - diaAtual, 0) : 0;
const ritmoDiarioNecessario = diasRestantes > 0 ? faltaParaMeta / diasRestantes : 0;

const saldoLiquidoAposTransferencias = Math.max(
  lucroLiquidoMes - transferenciasTotaisMes,
  0
);

const reservaSugerida = saldoLiquidoAposTransferencias * 0.2;
const transferenciaSeguraSugerida = Math.max(
  saldoLiquidoAposTransferencias - reservaSugerida,
  0
);


 const lancamentosComTipo = listaRecentes.map((item) => ({
  id: item.id,
  data: item.data,
  descricao: item.descricao,
  tipo: parseTipoFromDescricao(item.descricao ?? ""),
  perfil: item.perfil ?? "—",
  recebido: Number(item.valor_recebido ?? 0),
  custo: Number(item.custo_total ?? 0),
  lucro: Number(item.lucro_liquido ?? 0),
}));

const lancamentos =
  tipoSelecionado === "todos"
    ? lancamentosComTipo
    : lancamentosComTipo.filter((item) => item.tipo === tipoSelecionado);
    const historicoLanc = (lancamentosHistorico ?? []) as LancamentoHistoricoRow[];
const historicoTransf = (transferenciasHistorico ?? []) as TransferenciaHistoricoRow[];

const serieMap = new Map<string, SerieMensal>();
for (const mes of mesesHistorico) {
  serieMap.set(mes, {
    mes,
    receitas: 0,
    aportes: 0,
    custos: 0,
    transferencias: 0,
    lucroLiquido: 0,
  });
}

for (const item of historicoLanc) {
  const mes = item.data?.slice(0, 7);
  if (!mes || !serieMap.has(mes)) continue;

  const row = serieMap.get(mes)!;
  const tipo = parseTipoFromDescricao(item.descricao ?? "");
  const recebido = Number(item.valor_recebido ?? 0);
  const custo = Number(item.custo_total ?? 0);

  if (tipo === "receita_bruta") row.receitas += recebido;
  else if (tipo === "aporte_cpf_para_pj") row.aportes += recebido;
  else if (tipo === "taxa_financeira" || tipo === "despesa_operacional") row.custos += custo;
  else if (tipo === "transferencia_para_cpf") row.transferencias += custo;
}

for (const item of historicoTransf) {
  const mes = item.data_transferencia?.slice(0, 7);
  if (!mes || !serieMap.has(mes)) continue;

  const row = serieMap.get(mes)!;
  row.transferencias += Number(item.valor ?? 0);
}

const serieMensal = Array.from(serieMap.values()).map((row) => ({
  ...row,
  lucroLiquido: row.receitas + row.aportes - row.custos - row.transferencias,
}));

const serieComDados = serieMensal.filter(
  (m) => m.receitas > 0 || m.aportes > 0 || m.custos > 0 || m.transferencias > 0
);

const melhorMes =
  serieComDados.length > 0
    ? [...serieComDados].sort((a, b) => b.lucroLiquido - a.lucroLiquido)[0]
    : null;

const piorMes =
  serieComDados.length > 0
    ? [...serieComDados].sort((a, b) => a.lucroLiquido - b.lucroLiquido)[0]
    : null;

const mediaLucro =
  serieComDados.length > 0
    ? serieComDados.reduce((acc, m) => acc + m.lucroLiquido, 0) / serieComDados.length
    : 0;

const ultimos3 = serieMensal.slice(-3);
const anteriores3 = serieMensal.slice(-6, -3);

const mediaUltimos3 =
  ultimos3.length > 0 ? ultimos3.reduce((a, m) => a + m.lucroLiquido, 0) / ultimos3.length : 0;
const mediaAnteriores3 =
  anteriores3.length > 0
    ? anteriores3.reduce((a, m) => a + m.lucroLiquido, 0) / anteriores3.length
    : 0;

const tendencia = mediaUltimos3 - mediaAnteriores3;

const alertasHistorico: string[] = [];

for (let i = 2; i < serieMensal.length; i += 1) {
  const a = serieMensal[i - 2].lucroLiquido;
  const b = serieMensal[i - 1].lucroLiquido;
  const c = serieMensal[i].lucroLiquido;
  if (a > b && b > c) {
    alertasHistorico.push(
      `Queda de lucro por 3 competências seguidas até ${formatCompetenciaLabel(serieMensal[i].mes)}.`
    );
    break;
  }
}

const atualHistorico = serieMensal[serieMensal.length - 1];
if (atualHistorico && atualHistorico.receitas > 0) {
  const pctCustos = (atualHistorico.custos / atualHistorico.receitas) * 100;
  if (pctCustos >= 60) {
    alertasHistorico.push(
      `Custos estão em ${pctCustos.toFixed(1)}% da receita em ${formatCompetenciaLabel(
        atualHistorico.mes
      )}.`
    );
  }
}

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
  <div className="mb-5">
    <h2 className="text-lg font-semibold text-zinc-900">Fase 6 · Histórico e insights</h2>
    <p className="text-sm text-zinc-500">
      Visão dos últimos 12 meses da renda variável com tendências e alertas.
    </p>
  </div>

  <div className="grid gap-3 md:grid-cols-4">
    <div className="rounded-2xl bg-zinc-50 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">Melhor mês</p>
      <p className="mt-2 text-sm font-semibold text-zinc-900">
        {melhorMes ? `${formatCompetenciaLabel(melhorMes.mes)} · R$ ${formatMoney(melhorMes.lucroLiquido)}` : "—"}
      </p>
    </div>
    <div className="rounded-2xl bg-zinc-50 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">Pior mês</p>
      <p className="mt-2 text-sm font-semibold text-zinc-900">
        {piorMes ? `${formatCompetenciaLabel(piorMes.mes)} · R$ ${formatMoney(piorMes.lucroLiquido)}` : "—"}
      </p>
    </div>
    <div className="rounded-2xl bg-zinc-50 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">Média lucro</p>
      <p className="mt-2 text-sm font-semibold text-zinc-900">R$ {formatMoney(mediaLucro)}</p>
    </div>
    <div className="rounded-2xl bg-zinc-50 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">Tendência (3x3)</p>
      <p className={`mt-2 text-sm font-semibold ${tendencia >= 0 ? "text-emerald-700" : "text-red-700"}`}>
        {tendencia >= 0 ? "+" : "-"}R$ {formatMoney(Math.abs(tendencia))}
      </p>
    </div>
  </div>

  <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200">
    <div className="grid grid-cols-5 bg-zinc-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
      <span>Mês</span>
      <span className="text-right">Receitas</span>
      <span className="text-right">Custos</span>
      <span className="text-right">Transferências</span>
      <span className="text-right">Lucro líquido</span>
    </div>
    <div className="divide-y divide-zinc-200 text-sm">
      {serieMensal.map((m) => (
        <div key={m.mes} className="grid grid-cols-5 px-4 py-3">
          <span className="text-zinc-700">{formatCompetenciaLabel(m.mes)}</span>
          <span className="text-right text-zinc-700">R$ {formatMoney(m.receitas + m.aportes)}</span>
          <span className="text-right text-zinc-700">R$ {formatMoney(m.custos)}</span>
          <span className="text-right text-zinc-700">R$ {formatMoney(m.transferencias)}</span>
          <span className="text-right font-medium text-zinc-900">R$ {formatMoney(m.lucroLiquido)}</span>
        </div>
      ))}
    </div>
  </div>

  <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
    <p className="text-sm font-medium text-zinc-900">Alertas inteligentes</p>
    {alertasHistorico.length === 0 ? (
      <p className="mt-1 text-sm text-zinc-600">Sem alertas críticos no histórico recente.</p>
    ) : (
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
        {alertasHistorico.map((alerta) => (
          <li key={alerta}>{alerta}</li>
        ))}
      </ul>
    )}
  </div>
</section>
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                Módulo de renda variável
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
                  Renda variável
                </h1>
                <p className="max-w-2xl text-sm text-zinc-600 md:text-base">
                  Acompanhe quanto você recebeu, quanto custou para produzir ou
                  trabalhar e quanto realmente sobrou para guardar, transferir
                  ou investir nas suas metas.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/renda-variavel/novo"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
                Novo lançamento
              </Link>

              <Link
                href="/renda-variavel/transferir"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Transferir saldo
              </Link>

              <Link
                href="/renda-variavel/insumos"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                <Settings2 className="h-4 w-4" />
                Insumos
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Competência
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Consulte o histórico mensal sem interferir no mês seguinte.
              </p>
            </div>

            <form method="GET" className="w-full max-w-xs">
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Mês
              </label>
              <div className="flex items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-500">
                  <CalendarRange className="h-4 w-4" />
                </div>
                <input
                  type="month"
                  name="mes"
                  defaultValue={mesSelecionado}
                  className="h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-400"
                />
                <button
                  type="submit"
                  className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  Ver
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            Competência selecionada:{" "}
            <span className="font-semibold text-zinc-900">
              {formatCompetenciaLabel(mesSelecionado)}
            </span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-zinc-500">Saldo da carteira</span>
              <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-zinc-900">
              R$ {formatMoney(resumo.saldoCarteira)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Disponível para transferir ou guardar
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-zinc-500">Recebido no mês</span>
              <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-zinc-900">
              R$ {formatMoney(resumo.recebidoMes)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Total de receitas brutas (sem aportes)
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
  <div className="mb-4 flex items-center justify-between">
    <span className="text-sm text-zinc-500">Aportes no mês</span>
    <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
      <PiggyBank className="h-4 w-4" />
    </div>
  </div>
  <p className="text-2xl font-semibold tracking-tight text-zinc-900">
    R$ {formatMoney(resumo.aportesMes)}
  </p>
  <p className="mt-1 text-xs text-zinc-500">
    Entradas da conta CPF para PJ
  </p>
</div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-zinc-500">Custos no mês</span>
              <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-zinc-900">
              R$ {formatMoney(resumo.custosMes)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Taxas financeiras + despesas operacionais
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-zinc-500">Lucro líquido</span>
              <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
                <PiggyBank className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-zinc-900">
              R$ {formatMoney(resumo.lucroLiquidoMes)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              O que realmente sobrou no período
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-zinc-500">Horas no mês</span>
              <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
                <Clock3 className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-zinc-900">
              {resumo.totalHorasEstimadas.toFixed(1)}h
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Total trabalhado no período
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-zinc-500">Transferido no mês</span>
              <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-semibold tracking-tight text-zinc-900">
              R$ {formatMoney(resumo.transferidoMes)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Transferências da PJ para conta CPF
            </p>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Inteligência do período
                </h2>
                <p className="text-sm text-zinc-500">
                  Resumo rápido do seu desempenho em {formatCompetenciaLabel(mesSelecionado)}.
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Média por lançamento
                </p>
                <p className="mt-2 text-xl font-semibold text-zinc-900">
                  R$ {formatMoney(resumo.mediaPorLancamento)}
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Lucro por hora
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-zinc-500" />
                  <p className="text-xl font-semibold text-zinc-900">
                    R$ {formatMoney(resumo.lucroPorHora)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Projeção do mês
                </p>
                <p className="mt-2 text-xl font-semibold text-zinc-900">
                  R$ {formatMoney(resumo.projecaoMes)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              {listaMes.length === 0 ? (
                <>
                  <p className="text-sm font-medium text-emerald-800">
                    Você ainda não tem lançamentos nessa competência.
                  </p>
                  <p className="mt-1 text-sm text-emerald-700">
                    Selecione outro mês ou faça novos registros para acompanhar lucro real,
                    horas, eficiência e projeções.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-emerald-800">
                    Seus dados já estão sendo lidos do banco.
                  </p>
                  <p className="mt-1 text-sm text-emerald-700">
                    Agora você já consegue acompanhar o resultado real da sua
                    renda variável por mês, sem misturar competências.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-zinc-900">
                Ações rápidas
              </h2>
              <p className="text-sm text-zinc-500">
                Atalhos para o que você mais vai usar.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/renda-variavel/novo"
                className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-4 transition hover:bg-zinc-50"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    Novo lançamento
                  </p>
                  <p className="text-xs text-zinc-500">
                    Registrar trabalho, pedido, venda ou serviço
                  </p>
                </div>
                <Plus className="h-4 w-4 text-zinc-500" />
              </Link>

              <Link
                href="/renda-variavel/transferir"
                className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-4 transition hover:bg-zinc-50"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    Transferir saldo
                  </p>
                  <p className="text-xs text-zinc-500">
                    Enviar para financeiro geral ou metas
                  </p>
                </div>
                <ArrowRightLeft className="h-4 w-4 text-zinc-500" />
              </Link>

              <Link
                href="/renda-variavel/insumos"
                className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-4 transition hover:bg-zinc-50"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    Gerenciar insumos
                  </p>
                  <p className="text-xs text-zinc-500">
                    Cadastre custos base como gasolina, farinha e taxas
                  </p>
                </div>
                <Settings2 className="h-4 w-4 text-zinc-500" />
              </Link>
            </div>
          </div>
        </section>

         <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Fechamento mensal
                </h2>
                <p className="text-sm text-zinc-500">
                  Resumo consolidado de {formatCompetenciaLabel(mesSelecionado)} por tipo de movimentação.
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
                <CalendarRange className="h-4 w-4" />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              <div className="grid grid-cols-[2fr_1fr] bg-zinc-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                <span>Categoria</span>
                <span className="text-right">Valor</span>
              </div>
              <div className="divide-y divide-zinc-200 text-sm">
                <div className="grid grid-cols-[2fr_1fr] px-4 py-3">
                  <span className="text-zinc-600">Receitas</span>
                  <span className="text-right font-medium text-zinc-900">R$ {formatMoney(totais.receitas)}</span>
                </div>
                <div className="grid grid-cols-[2fr_1fr] px-4 py-3">
                  <span className="text-zinc-600">Aportes</span>
                  <span className="text-right font-medium text-zinc-900">R$ {formatMoney(totais.aportes)}</span>
                </div>
                <div className="grid grid-cols-[2fr_1fr] px-4 py-3">
                  <span className="text-zinc-600">Custos + taxas</span>
                  <span className="text-right font-medium text-zinc-900">R$ {formatMoney(totais.custos)}</span>
                </div>
                <div className="grid grid-cols-[2fr_1fr] px-4 py-3">
                  <span className="text-zinc-600">Transferências</span>
                  <span className="text-right font-medium text-zinc-900">R$ {formatMoney(transferenciasTotaisMes)}</span>
                </div>
                <div className="grid grid-cols-[2fr_1fr] bg-zinc-50 px-4 py-3">
                  <span className="font-semibold text-zinc-900">Resultado líquido</span>
                  <span className="text-right font-semibold text-zinc-900">R$ {formatMoney(lucroLiquidoMes)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-zinc-900">
                Mês atual × mês anterior
              </h2>
              <p className="text-sm text-zinc-500">
                Comparativo entre {formatCompetenciaLabel(mesSelecionado)} e {formatCompetenciaLabel(mesAnterior)}.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: "Receitas", delta: comparativo.receitas },
                { label: "Aportes", delta: comparativo.aportes },
                { label: "Custos + taxas", delta: comparativo.custos },
                { label: "Transferências", delta: comparativo.transferencias },
                { label: "Resultado líquido", delta: comparativo.lucroLiquido },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3"
                >
                  <span className="text-sm text-zinc-700">{item.label}</span>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        item.delta.isPositivo ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {item.delta.isPositivo ? "+" : "-"}R$ {formatMoney(Math.abs(item.delta.diferenca))}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {item.delta.percentual === null
                        ? "Sem base no mês anterior"
                        : `${item.delta.percentual >= 0 ? "+" : ""}${item.delta.percentual.toFixed(1)}%`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {transferenciaAcimaDoSaldo ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-amber-100 p-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-amber-900">
                  Alerta de inconsistência
                </h2>
                <p className="mt-1 text-sm text-amber-800">
                  As transferências do período ({formatMoney(transferenciasTotaisMes)}) estão
                  maiores que o resultado líquido ({formatMoney(lucroLiquidoMes)}). Revise os
                  lançamentos para garantir que não houve duplicidade ou classificação incorreta.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
  <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Fase 5 · Meta e ritmo do mês
        </h2>
        <p className="text-sm text-zinc-500">
          Defina uma meta de lucro líquido para {formatCompetenciaLabel(mesSelecionado)} e acompanhe o ritmo.
        </p>
      </div>
      <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
        <TrendingUp className="h-4 w-4" />
      </div>
    </div>

    <form method="GET" className="mb-4 grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-[1fr_auto] md:items-end">
      <input type="hidden" name="mes" value={mesSelecionado} />
      <input type="hidden" name="tipo" value={tipoSelecionado} />
      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          Meta de lucro líquido
        </span>
        <input
          type="number"
          name="meta"
          min="0"
          step="0.01"
          defaultValue={metaMensal > 0 ? metaMensal.toFixed(2) : ""}
          placeholder="Ex.: 8000"
          className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-400"
        />
      </label>
      <button
        type="submit"
        className="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
      >
        Atualizar meta
      </button>
    </form>

    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl bg-zinc-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Progresso da meta
        </p>
        <p className="mt-2 text-xl font-semibold text-zinc-900">
          {progressoMeta.toFixed(1)}%
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          R$ {formatMoney(lucroLiquidoMes)} de R$ {formatMoney(metaMensal)}
        </p>
      </div>

      <div className="rounded-2xl bg-zinc-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Falta para meta
        </p>
        <p className="mt-2 text-xl font-semibold text-zinc-900">
          R$ {formatMoney(faltaParaMeta)}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {faltaParaMeta > 0 ? "Valor restante para bater a meta" : "Meta atingida no período"}
        </p>
      </div>

      <div className="rounded-2xl bg-zinc-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Ritmo diário necessário
        </p>
        <p className="mt-2 text-xl font-semibold text-zinc-900">
          R$ {formatMoney(ritmoDiarioNecessario)}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {diasRestantes > 0
            ? `Com ${diasRestantes} dia(s) restantes`
            : "Sem dias restantes no mês selecionado"}
        </p>
      </div>
    </div>

    {excedenteMeta > 0 ? (
      <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
        Excelente: você está R$ {formatMoney(excedenteMeta)} acima da meta dessa competência.
      </div>
    ) : null}
  </div>

  <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-zinc-900">
        Planejamento de transferência
      </h2>
      <p className="text-sm text-zinc-500">
        Sugestão automática para transferir com reserva de segurança.
      </p>
    </div>

    <div className="space-y-3">
      <div className="rounded-2xl bg-zinc-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Saldo líquido após transferências
        </p>
        <p className="mt-2 text-xl font-semibold text-zinc-900">
          R$ {formatMoney(saldoLiquidoAposTransferencias)}
        </p>
      </div>
      <div className="rounded-2xl bg-zinc-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Reserva sugerida (20%)
        </p>
        <p className="mt-2 text-xl font-semibold text-zinc-900">
          R$ {formatMoney(reservaSugerida)}
        </p>
      </div>
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
          Máximo sugerido para nova transferência
        </p>
        <p className="mt-2 text-xl font-semibold text-emerald-900">
          R$ {formatMoney(transferenciaSeguraSugerida)}
        </p>
      </div>
    </div>
  </div>
</section>


        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Lançamentos recentes
              </h2>
              <p className="text-sm text-zinc-500">
                Histórico dos registros mais recentes da sua renda variável.
              </p>
            </div>

            <div className="flex items-center gap-2">
  <form method="GET" className="flex items-center gap-2">
    <input type="hidden" name="mes" value={mesSelecionado} />
    <select
      name="tipo"
      defaultValue={tipoSelecionado}
      className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700"
    >
      <option value="todos">Todos os tipos</option>
      {Object.entries(TIPO_RV_LABEL).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
    <button
      type="submit"
      className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
    >
      Filtrar
    </button>
  </form>

  <Link
    href="/renda-variavel/novo"
    className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
  >
    <Plus className="h-4 w-4" />
    Novo
  </Link>
</div>
          </div>

          {lancamentos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center">
              <p className="text-sm font-medium text-zinc-900">
                Você ainda não tem lançamentos cadastrados.
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Comece registrando seus trabalhos, vendas, pedidos ou serviços
                para acompanhar quanto realmente sobra.
              </p>

              <Link
                href="/renda-variavel/novo"
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
                Fazer primeiro lançamento
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 lg:block">
                <div className="grid grid-cols-8 gap-4 bg-zinc-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <span>Data</span>
                  <span className="col-span-2">Descrição</span>
                  <span>Perfil</span>
                  <span>Recebido</span>
                  <span>Lucro</span>
                  <span className="col-span-2 text-right">Ações</span>
                </div>

                <div className="divide-y divide-zinc-200">
                  {lancamentos.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-8 items-center gap-4 px-4 py-4 text-sm"
                    >
                      <span className="text-zinc-600">
                        {formatDate(item.data)}
                      </span>

                      <div className="col-span-2">
  <span className="font-medium text-zinc-900">{item.descricao}</span>
  {item.tipo ? (
    <span className="ml-2 inline-flex rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-700">
      {TIPO_RV_LABEL[item.tipo]}
    </span>
  ) : null}
</div>

                      <span className="text-zinc-600">{item.perfil}</span>

                      <span className="text-zinc-600">
                        R$ {formatMoney(item.recebido)}
                      </span>

                      <span className="font-medium text-zinc-900">
                        R$ {formatMoney(item.lucro)}
                      </span>

                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <Link
                          href={`/renda-variavel/${item.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Abrir / editar
                        </Link>

                        <form action={excluirLancamento}>
                          <input type="hidden" name="id" value={item.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Excluir
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 lg:hidden">
                {lancamentos.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-zinc-500">
                          {formatDate(item.data)}
                        </p>
                        <p className="mt-1 font-medium text-zinc-900">
                          {item.descricao}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          Perfil: {item.perfil}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-zinc-500">Lucro</p>
                        <p className="font-semibold text-zinc-900">
                          R$ {formatMoney(item.lucro)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-sm text-zinc-600">
                        Recebido: R$ {formatMoney(item.recebido)}
                      </p>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/renda-variavel/${item.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Link>

                        <form action={excluirLancamento}>
                          <input type="hidden" name="id" value={item.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Excluir
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}