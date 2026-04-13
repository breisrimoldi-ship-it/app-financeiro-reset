import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { TIPO_RV_LABEL, type TipoRvLancamento } from "../_lib/tipos";
import type { FiltroTipo } from "../_lib/types";
import { formatMoney, formatDate } from "../_lib/utils";

type LancamentoUI = {
  id: string;
  data: string;
  descricao: string;
  tipo: TipoRvLancamento | null;
  perfil: string;
  recebido: number;
  custo: number;
  lucro: number;
};

export function LancamentosSection({
  lancamentos,
  mesSelecionado,
  tipoSelecionado,
  excluirLancamento,
}: {
  lancamentos: LancamentoUI[];
  mesSelecionado: string;
  tipoSelecionado: FiltroTipo;
  excluirLancamento: (formData: FormData) => Promise<void>;
}) {
  return (
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
  );
}
