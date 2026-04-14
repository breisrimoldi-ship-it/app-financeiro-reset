import { ArrowUpRight, Calendar, Landmark, Tag } from "lucide-react";
import type { CategoryOption, Movimentacao } from "../_lib/types";
import { formatCurrency, formatDate, resolveCategoryLabel } from "../_lib/utils";
import { AcaoItem } from "./acao-item";

export function CardEntradaPremium({
  item,
  categoryOptions,
  nomeConta,
  onEdit,
  onDelete,
  onOpen,
}: {
  item: Movimentacao;
  categoryOptions: CategoryOption[];
  nomeConta?: string;
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
                  {resolveCategoryLabel(item.categoria, categoryOptions)}
                </span>

                {nomeConta && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                    <Landmark className="h-3.5 w-3.5" />
                    {nomeConta}
                  </span>
                )}
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
