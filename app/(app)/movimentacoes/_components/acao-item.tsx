import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export function AcaoItem({
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
