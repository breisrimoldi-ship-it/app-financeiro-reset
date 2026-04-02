import Link from "next/link";
import { revalidatePath } from "next/cache";
import { parseTipoFromDescricao } from "./_lib/tipos";
import {
  ArrowRightLeft,
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
import { createClient } from "@/lib/supabase/server";

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

type PageProps = {
  searchParams?: Promise<{
    mes?: string;
  }>;
};

export default async function RendaVariavelPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const mesSelecionado = resolvedSearchParams.mes || getMesAtual();

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

  const { data: transferenciasMes, error: erroTransferencias } = await supabase
    .from("rv_transferencias")
    .select("valor")
    .eq("user_id", user.id)
    .gte("data_transferencia", inicioStr)
    .lte("data_transferencia", fimStr);

  if (erroTransferencias) {
    throw new Error(erroTransferencias.message);
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
  const listaRecentes = (lancamentosRecentes ?? []) as LancamentoRow[];
  const listaTransferencias = (transferenciasMes ?? []) as TransferenciaRow[];

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

for (const item of listaMes) {
  const tipo = parseTipoFromDescricao(item.descricao ?? "");
  const recebido = Number(item.valor_recebido ?? 0);
  const custo = Number(item.custo_total ?? 0);

  if (tipo === "receita_bruta") totais.receitas += recebido;
  else if (tipo === "aporte_cpf_para_pj") totais.aportes += recebido;
  else if (tipo === "transferencia_para_cpf") totais.transferencias += custo;
  else if (tipo === "taxa_financeira" || tipo === "despesa_operacional") totais.custos += custo;
}

  const lucroLiquidoMes =
  totais.receitas + totais.aportes - totais.custos - totais.transferencias;

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
  transferidoMes: totais.transferencias + transferidoMesLegado,
  totalHorasEstimadas,
  mediaPorLancamento,
  lucroPorHora,
  projecaoMes,
};

  const lancamentos = listaRecentes.map((item) => ({
  id: item.id,
  data: item.data,
  descricao: item.descricao,
  tipo: parseTipoFromDescricao(item.descricao ?? ""),
  perfil: item.perfil ?? "—",
  recebido: Number(item.valor_recebido ?? 0),
  custo: Number(item.custo_total ?? 0),
  lucro: Number(item.lucro_liquido ?? 0),
}));

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
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

            <Link
              href="/renda-variavel/novo"
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              <Plus className="h-4 w-4" />
              Novo
            </Link>
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

                      <span className="col-span-2 font-medium text-zinc-900">
                        {item.descricao}
                      </span>

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