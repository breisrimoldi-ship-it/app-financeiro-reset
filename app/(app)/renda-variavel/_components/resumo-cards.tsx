import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Clock3,
  ArrowRightLeft,
} from "lucide-react";
import { formatMoney } from "../_lib/utils";

type Resumo = {
  saldoCarteira: number;
  recebidoMes: number;
  aportesMes: number;
  custosMes: number;
  lucroLiquidoMes: number;
  totalHorasEstimadas: number;
  transferidoMes: number;
};

export function ResumoCards({ resumo }: { resumo: Resumo }) {
  return (
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
  );
}
