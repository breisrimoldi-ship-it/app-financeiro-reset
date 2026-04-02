"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

type InsightsItem = {
  tipo: "alerta" | "positivo" | "neutro";
  texto: string;
};

type RecomendacaoAcao = {
  tipo: "guardar_meta";
  valor: number;
  metaId: string;
  metaNome: string;
};

type RecomendacaoItem = {
  tipo: "acao" | "alerta";
  texto: string;
  acao?: RecomendacaoAcao;
};

type ContaFixaDashboard = {
  id: number;
  descricao: string;
  valor: number | string | null;
  dia_vencimento: number | null;
  categoria: string | null;
  observacoes: string | null;
  ativa: boolean;
  user_id: string | null;
  tipo_recorrencia: "indeterminada" | "temporaria";
  inicio_cobranca: string | null;
  fim_cobranca: string | null;
  quantidade_meses: number | null;
  created_at: string;
  updated_at: string;
};

type AlertasContas = {
  vencidas: Array<{ conta: ContaFixaDashboard; dataVencimento: string }>;
  vencemHoje: Array<{ conta: ContaFixaDashboard; dataVencimento: string }>;
  vencemBreve: Array<{ conta: ContaFixaDashboard; dataVencimento: string }>;
  total: number;
};

type Previsao = {
  saldoFinalPrevisto: number;
  gastoDiarioAtual: number;
};


type Props = {
  insights: InsightsItem[];
  previsao: Previsao;
  recomendacoes: RecomendacaoItem[];
  sugestoesReceita: string[];
  alertasContas: AlertasContas;
  formatarMoeda: (valor: number) => string;
  formatarData: (data: string | null) => string;
  normalizarNumero: (valor: number | string | null | undefined) => number;
  pagarContaDashboard: (conta: ContaFixaDashboard) => void | Promise<void>;
  executarAcao: (acao: RecomendacaoAcao) => void;
};

export function InteligenciaMesSection({
  insights,
  previsao,
  recomendacoes,
  sugestoesReceita,
  alertasContas,
  formatarMoeda,
  formatarData,
  normalizarNumero,
  pagarContaDashboard,
  executarAcao,
}: Props) {
  return (
    <section className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Inteligência do mês</h2>
        <p className="mt-1 text-sm text-zinc-500">
          O essencial para decidir o que fazer agora, sem poluição visual.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-zinc-900">Situação do mês</h3>

          {insights.map((item, i) => {
            const estilo =
              item.tipo === "alerta"
                ? "border-red-200 bg-red-50 text-red-700"
                : item.tipo === "positivo"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-zinc-50 text-zinc-700";

            return (
              <div
                key={`insight-${i}`}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium ${estilo}`}
              >
                {item.texto}
              </div>
            );
          })}

          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
              previsao.saldoFinalPrevisto < 0
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {previsao.saldoFinalPrevisto < 0
              ? `Se continuar assim, você fechará o mês com ${formatarMoeda(
                  previsao.saldoFinalPrevisto
                )}`
              : `Você terminará o mês com aproximadamente ${formatarMoeda(
                  previsao.saldoFinalPrevisto
                )}`}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            Gasto médio diário: <strong>{formatarMoeda(previsao.gastoDiarioAtual)}</strong>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-semibold text-zinc-900">Próximas ações</h3>

          {recomendacoes.map((item, i) => {
            const estilo =
              item.tipo === "alerta"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700";

            return (
              <div
                key={`acao-${i}`}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium ${estilo}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span>{item.texto}</span>
                  {item.acao ? (
                    <button
                      type="button"
                      onClick={() => executarAcao(item.acao!)}
                      className="shrink-0 rounded-xl bg-black px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                    >
                      Guardar agora
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}

          {sugestoesReceita.slice(0, 2).map((texto, index) => (
            <div
              key={`sugestao-${index}`}
              className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700"
            >
              {texto}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-zinc-900">Alertas de contas</h3>

        {alertasContas.total === 0 ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Nenhuma conta crítica no momento.
          </div>
        ) : (
          <div className="space-y-3">
            {alertasContas.vencidas.map((item) => (
              <div
                key={`vencida-${item.conta.id}`}
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-red-700">
                      Conta vencida • {item.conta.descricao}
                    </p>
                    <p className="mt-1 text-sm text-red-600">
                      Venceu em {formatarData(item.dataVencimento)} •{" "}
                      {formatarMoeda(normalizarNumero(item.conta.valor))}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      className="rounded-xl bg-black px-3 py-1.5 text-xs text-white"
                      onClick={() => pagarContaDashboard(item.conta)}
                    >
                      Pagar
                    </button>
                    <Link
                      href="/contas"
                      className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver em Contas
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {alertasContas.vencemHoje.map((item) => (
              <div
                key={`hoje-${item.conta.id}`}
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-amber-700">
                      Conta vence hoje • {item.conta.descricao}
                    </p>
                    <p className="mt-1 text-sm text-amber-600">
                      Vencimento em {formatarData(item.dataVencimento)} •{" "}
                      {formatarMoeda(normalizarNumero(item.conta.valor))}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      className="rounded-xl bg-black px-3 py-1.5 text-xs text-white"
                      onClick={() => pagarContaDashboard(item.conta)}
                    >
                      Pagar
                    </button>
                    <Link
                      href="/contas"
                      className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver em Contas
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {alertasContas.vencemBreve.map((item) => (
              <div
                key={`breve-${item.conta.id}`}
                className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-700">
                      Conta vencendo em breve • {item.conta.descricao}
                    </p>
                    <p className="mt-1 text-sm text-blue-600">
                      Vence em {formatarData(item.dataVencimento)} •{" "}
                      {formatarMoeda(normalizarNumero(item.conta.valor))}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      className="rounded-xl bg-black px-3 py-1.5 text-xs text-white"
                      onClick={() => pagarContaDashboard(item.conta)}
                    >
                      Pagar
                    </button>
                    <Link
                      href="/contas"
                      className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver em Contas
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}