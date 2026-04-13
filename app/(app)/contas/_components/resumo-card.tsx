import type { ResumoCardProps } from "../_lib/types";
import { cls } from "../_lib/utils";

export function ResumoCard({
  titulo,
  valor,
  descricao,
  icon,
  destaque = "default",
}: ResumoCardProps) {
  const estilos =
    destaque === "blue"
      ? "border-blue-100 bg-gradient-to-br from-blue-50 to-white"
      : destaque === "amber"
      ? "border-amber-100 bg-gradient-to-br from-amber-50 to-white"
      : destaque === "sky"
      ? "border-sky-100 bg-gradient-to-br from-sky-50 to-white"
      : "border-slate-200 bg-gradient-to-br from-slate-50 to-white";

  const valorCor =
    destaque === "blue"
      ? "text-blue-700"
      : destaque === "amber"
      ? "text-amber-600"
      : destaque === "sky"
      ? "text-sky-600"
      : "text-slate-900";

  return (
    <div className={cls("rounded-[28px] border p-5 shadow-sm", estilos)}>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        {icon}
        <span>{titulo}</span>
      </div>
      <p className={cls("mt-4 text-3xl font-semibold tracking-tight", valorCor)}>
        {valor}
      </p>
      <p className="mt-2 text-xs text-slate-400">{descricao}</p>
    </div>
  );
}
