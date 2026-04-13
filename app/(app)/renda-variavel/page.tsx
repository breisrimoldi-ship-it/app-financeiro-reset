import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseTipoFromDescricao } from "./_lib/tipos";
import type {
  LancamentoRow,
  TransferenciaRow,
  LancamentoHistoricoRow,
  TransferenciaHistoricoRow,
  SerieMensal,
  PageProps,
} from "./_lib/types";
import {
  formatMoney,
  stripTipoPrefix,
  getMesAtual,
  getRangeFromMes,
  getMesAnterior,
  formatCompetenciaLabel,
  formatDelta,
  getUltimosMeses,
  getRangeFromMeses,
} from "./_lib/utils";
import { HeaderActions } from "./_components/header-actions";
import { HistoricoSection } from "./_components/historico-section";
import { ResumoCards } from "./_components/resumo-cards";
import { LancamentosSection } from "./_components/lancamentos-section";
import {
  ArrowRightLeft,
  AlertTriangle,
  Settings2,
  Sparkles,
  Clock3,
  CalendarRange,
  TrendingUp,
} from "lucide-react";

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
    .limit(50);

  if (erroRecentes) {
    throw new Error(erroRecentes.message);
  }

  const { data: perfisAtivos, error: erroPerfis } = await supabase
    .from("rv_perfis")
    .select("id, nome")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (erroPerfis) {
    throw new Error(erroPerfis.message);
  }

  const { data: contasAtivas } = await supabase
    .from("rv_contas")
    .select("id, nome")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .order("nome", { ascending: true });

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

  const totais = { receitas: 0, aportes: 0, custos: 0, transferencias: 0 };
  const totaisMesAnterior = { receitas: 0, aportes: 0, custos: 0, transferencias: 0 };

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

  const lucroLiquidoMes = totais.receitas - totais.custos;
  const transferidoMesAnteriorLegado = listaTransferenciasMesAnterior.reduce(
    (acc, item) => acc + Number(item.valor ?? 0),
    0
  );
  const lucroLiquidoMesAnterior =
    totaisMesAnterior.receitas - totaisMesAnterior.custos;
  const transferenciasTotaisMes = totais.transferencias + transferidoMesLegado;
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
    saldoCarteira: Math.max(lucroLiquidoMes - transferenciasTotaisMes, 0),
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
    descricao: stripTipoPrefix(item.descricao ?? ""),
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
    lucroLiquido: row.receitas - row.custos,
  }));

  const serieComDados = serieMensal.filter(
    (m) => m.receitas > 0 || m.aportes > 0 || m.custos > 0 || m.transferencias > 0
  );

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <HeaderActions
          mesSelecionado={mesSelecionado}
          perfis={(perfisAtivos ?? []) as { id: string; nome: string }[]}
          contas={(contasAtivas ?? []) as { id: string; nome: string }[]}
        />

        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
          Competência selecionada:{" "}
          <span className="font-semibold text-zinc-900">
            {formatCompetenciaLabel(mesSelecionado)}
          </span>
        </div>

        <ResumoCards resumo={resumo} />

        {/* Inteligência + Ações rápidas */}
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

        {/* Fechamento mensal + Comparativo */}
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

        {/* Meta e ritmo + Planejamento */}
        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Meta e ritmo do mês
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

        <HistoricoSection serieMensal={serieMensal} serieComDados={serieComDados} />

        <LancamentosSection
          lancamentos={lancamentos}
          mesSelecionado={mesSelecionado}
          tipoSelecionado={tipoSelecionado}
          excluirLancamento={excluirLancamento}
        />
      </div>
    </main>
  );
}
