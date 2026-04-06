import React from "react";
import { classNames } from "../_lib/utils";

export function ResumoCard({
  titulo,
  valor,
  subtitulo,
  icon,
  tone = "default",
}: {
  titulo: string;
  valor: string;
  subtitulo: string;
  icon: React.ReactNode;
  tone?: "default" | "emerald" | "blue" | "orange";
}) {
  const toneClasses =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50/70"
      : tone === "blue"
      ? "border-blue-200 bg-blue-50/70"
      : tone === "orange"
      ? "border-orange-200 bg-orange-50/70"
      : "border-slate-200 bg-white";

  return (
    <div
      className={classNames(
        "rounded-[28px] border px-5 py-5 shadow-sm md:px-6",
        toneClasses
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            {titulo}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {valor}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitulo}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-slate-600 ring-1 ring-black/5">
          {icon}
        </div>
      </div>
    </div>
  );
}
