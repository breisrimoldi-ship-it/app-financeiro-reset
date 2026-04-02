"use client";

import React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CreditCard,
  TrendingUp,
} from "lucide-react";

export type ResumoCardAtivo =
  | "entradas"
  | "saidas"
  | "comprometido"
  | "adiantadas"
  | "contas";

type ResumoCardsProps = {
  entradasMesTexto: string;
  saidasPagasMesTexto: string;
  comprometidoTexto: string;
  adiantadasMesTexto: string;
  contasMesTexto: string;
  cardAtivo: ResumoCardAtivo | null;
  onToggleCard: (card: ResumoCardAtivo) => void;
};

function CardResumo({
  titulo,
  valor,
  descricao,
  icon,
  tone = "default",
  active = false,
  onClick,
}: {
  titulo: string;
  valor: string;
  descricao: string;
  icon: React.ReactNode;
  tone?: "default" | "success" | "warning" | "blue";
  active?: boolean;
  onClick?: () => void;
}) {
  const styles = {
    default: {
      wrap: "border-zinc-200 bg-white hover:border-zinc-300",
      icon: "bg-zinc-100 text-zinc-700",
      value: "text-zinc-900",
      active: "ring-2 ring-zinc-300",
    },
    success: {
      wrap: "border-emerald-200 bg-emerald-50/70 hover:border-emerald-300",
      icon: "bg-emerald-100 text-emerald-700",
      value: "text-emerald-700",
      active: "ring-2 ring-emerald-300",
    },
    warning: {
      wrap: "border-orange-200 bg-orange-50/70 hover:border-orange-300",
      icon: "bg-orange-100 text-orange-700",
      value: "text-orange-700",
      active: "ring-2 ring-orange-300",
    },
    blue: {
      wrap: "border-blue-200 bg-blue-50/70 hover:border-blue-300",
      icon: "bg-blue-100 text-blue-700",
      value: "text-blue-700",
      active: "ring-2 ring-blue-300",
    },
  };

  const current = styles[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] ${current.wrap} ${
        active ? current.active : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-500">{titulo}</p>
          <p className={`mt-2 text-3xl font-semibold tracking-tight ${current.value}`}>
            {valor}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">{descricao}</p>
        </div>
        <div className={`rounded-2xl p-3 ${current.icon}`}>{icon}</div>
      </div>
    </button>
  );
}

export function ResumoCards({
  entradasMesTexto,
  saidasPagasMesTexto,
  comprometidoTexto,
  adiantadasMesTexto,
  contasMesTexto,
  cardAtivo,
  onToggleCard,
}: ResumoCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <CardResumo
        titulo="Entradas do mês"
        valor={entradasMesTexto}
        descricao="Resumo rápido das entradas"
        icon={<ArrowUpRight className="h-5 w-5" />}
        tone="success"
        active={cardAtivo === "entradas"}
        onClick={() => onToggleCard("entradas")}
      />
      <CardResumo
        titulo="Saídas pagas"
        valor={saidasPagasMesTexto}
        descricao="O que já saiu de verdade"
        icon={<ArrowDownRight className="h-5 w-5" />}
        tone="default"
        active={cardAtivo === "saidas"}
        onClick={() => onToggleCard("saidas")}
      />
      <CardResumo
        titulo="Comprometido"
        valor={comprometidoTexto}
        descricao="Faturas e contas ainda em aberto"
        icon={<CreditCard className="h-5 w-5" />}
        tone="warning"
        active={cardAtivo === "comprometido"}
        onClick={() => onToggleCard("comprometido")}
      />
      <CardResumo
        titulo="Adiantadas no mês"
        valor={adiantadasMesTexto}
        descricao="Pagamentos futuros antecipados"
        icon={<TrendingUp className="h-5 w-5" />}
        tone="blue"
        active={cardAtivo === "adiantadas"}
        onClick={() => onToggleCard("adiantadas")}
      />
      <CardResumo
        titulo="Contas do mês"
        valor={contasMesTexto}
        descricao="Total das contas recorrentes e temporárias"
        icon={<Calendar className="h-5 w-5" />}
        tone="default"
        active={cardAtivo === "contas"}
        onClick={() => onToggleCard("contas")}
      />
    </section>
  );
}