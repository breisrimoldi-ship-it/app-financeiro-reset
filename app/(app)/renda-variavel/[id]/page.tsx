import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Clock3, Receipt, Sparkles } from "lucide-react";
import { parseTipoFromDescricao, TIPO_RV_LABEL } from "../_lib/tipos";

type Props = {
  params: Promise<{ id: string }>;
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

function stripTipoPrefix(descricao: string) {
  if (!descricao) return "";
  return descricao.replace(/^\[(.+?)\]\s*/, "").trim();
}

export default async function DetalheLancamentoPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: lancamento, error: lancamentoError } = await supabase
    .from("rv_lancamentos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (lancamentoError) {
    if (lancamentoError.code === "PGRST116") {
      notFound();
    }
    throw new Error(lancamentoError.message);
  }

  const { data: itens } = await supabase
    .from("rv_lancamento_itens")
    .select("*")
    .eq("lancamento_id", id)
    .eq("user_id", user.id)
    .order("id", { ascending: true });

  const { data: custos } = await supabase
    .from("rv_lancamento_custos")
    .select("*")
    .eq("lancamento_id", id)
    .eq("user_id", user.id)
    .order("id", { ascending: true });

  const descricaoOriginal = lancamento.descricao ?? "";
  const tipo = parseTipoFromDescricao(descricaoOriginal);
  const descricao = stripTipoPrefix(descricaoOriginal);

  const valorRecebido = Number(lancamento.valor_recebido ?? 0);
  const custoTotal = Number(lancamento.custo_total ?? 0);
  const custoInsumos = Number(lancamento.custo_insumos ?? 0);
  const custoManual = Number(lancamento.custo_manual_valor ?? 0);
  const lucroLiquido = Number(lancamento.lucro_liquido ?? 0);
  const lucroPorHora = Number(lancamento.lucro_por_hora ?? 0);
  const margem = Number(lancamento.margem ?? 0);
  const horas = Number(lancamento.horas_trabalhadas ?? 0);
  const quantidade = Number(lancamento.quantidade ?? 0);

  const listaItens = (itens ?? []) as Array<{
    id: string;
    insumo_nome: string | null;
    nome_snapshot: string | null;
    unidade: string | null;
    unidade_snapshot: string | null;
    valor_base: number | null;
    valor_snapshot: number | null;
    quantidade: number | null;
    total: number | null;
  }>;

  const listaCustos = (custos ?? []) as Array<{
    id: string;
    categoria_nome: string | null;
    descricao: string | null;
    valor: number | null;
  }>;

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        {/* Header */}
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <Link
            href="/renda-variavel"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para renda variável
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                Detalhe do lançamento
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                {descricao || "Sem descrição"}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                <span>{formatDate(lancamento.data)}</span>
                {tipo ? (
                  <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                    {TIPO_RV_LABEL[tipo]}
                  </span>
                ) : null}
                {lancamento.perfil ? (
                  <span>Perfil: {lancamento.perfil}</span>
                ) : null}
                {lancamento.cliente ? (
                  <span>Cliente: {lancamento.cliente}</span>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* Resumo financeiro */}
        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Valor recebido
            </p>
            <p className="mt-2 text-xl font-semibold text-zinc-900">
              R$ {formatMoney(valorRecebido)}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Custo total
            </p>
            <p className="mt-2 text-xl font-semibold text-zinc-900">
              R$ {formatMoney(custoTotal)}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Lucro líquido
            </p>
            <p className="mt-2 text-xl font-semibold text-emerald-900">
              R$ {formatMoney(lucroLiquido)}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5 text-zinc-500" />
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Lucro/hora
              </p>
            </div>
            <p className="mt-2 text-xl font-semibold text-zinc-900">
              R$ {formatMoney(lucroPorHora)}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Margem
            </p>
            <p className="mt-2 text-xl font-semibold text-zinc-900">
              {margem.toFixed(1)}%
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Horas / Qtd
            </p>
            <p className="mt-2 text-xl font-semibold text-zinc-900">
              {horas > 0 ? `${horas.toFixed(1)}h` : "—"}
              {quantidade > 0 ? ` · ${quantidade}` : ""}
            </p>
          </div>
        </section>

        {/* Breakdown de custos */}
        <section className="grid gap-4 xl:grid-cols-2">
          {/* Insumos */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Insumos utilizados
                </h2>
                <p className="text-sm text-zinc-500">
                  Total em insumos: R$ {formatMoney(custoInsumos)}
                </p>
              </div>
            </div>

            {listaItens.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Nenhum insumo registrado neste lançamento.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-zinc-200">
                <div className="grid grid-cols-4 bg-zinc-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <span>Insumo</span>
                  <span className="text-right">Qtd</span>
                  <span className="text-right">Valor und</span>
                  <span className="text-right">Total</span>
                </div>
                <div className="divide-y divide-zinc-200 text-sm">
                  {listaItens.map((item) => (
                    <div key={item.id} className="grid grid-cols-4 px-4 py-3">
                      <span className="text-zinc-700">
                        {item.nome_snapshot ?? item.insumo_nome ?? "—"}
                      </span>
                      <span className="text-right text-zinc-600">
                        {Number(item.quantidade ?? 0)} {item.unidade_snapshot ?? item.unidade ?? ""}
                      </span>
                      <span className="text-right text-zinc-600">
                        R$ {formatMoney(Number(item.valor_snapshot ?? item.valor_base ?? 0))}
                      </span>
                      <span className="text-right font-medium text-zinc-900">
                        R$ {formatMoney(Number(item.total ?? 0))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custos detalhados */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Custos detalhados
                </h2>
                <p className="text-sm text-zinc-500">
                  Total manual: R$ {formatMoney(custoManual)}
                </p>
              </div>
            </div>

            {listaCustos.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Nenhum custo detalhado registrado neste lançamento.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-zinc-200">
                <div className="grid grid-cols-3 bg-zinc-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <span>Categoria</span>
                  <span>Descrição</span>
                  <span className="text-right">Valor</span>
                </div>
                <div className="divide-y divide-zinc-200 text-sm">
                  {listaCustos.map((custo) => (
                    <div key={custo.id} className="grid grid-cols-3 px-4 py-3">
                      <span className="text-zinc-700">
                        {custo.categoria_nome ?? "—"}
                      </span>
                      <span className="text-zinc-600">
                        {custo.descricao ?? "—"}
                      </span>
                      <span className="text-right font-medium text-zinc-900">
                        R$ {formatMoney(Number(custo.valor ?? 0))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lancamento.custo_manual_descricao ? (
              <div className="mt-4 rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Descrição dos custos manuais
                </p>
                <p className="mt-1 text-sm text-zinc-700">
                  {lancamento.custo_manual_descricao}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
