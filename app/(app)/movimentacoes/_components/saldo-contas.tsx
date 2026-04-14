"use client";

import { Landmark } from "lucide-react";
import type { Movimentacao } from "../_lib/types";
import { formatCurrency } from "../_lib/utils";

type ContaComSaldo = {
  id: string;
  nome: string;
  tipo: string;
  saldo_inicial: number;
};

export function SaldoContas({
  contas,
  movimentacoes,
}: {
  contas: ContaComSaldo[];
  movimentacoes: Movimentacao[];
}) {
  const contasCpf = contas.filter((c) => c.tipo === "cpf");

  if (contasCpf.length === 0) return null;

  const saldos = contasCpf.map((conta) => {
    let saldo = conta.saldo_inicial;

    for (const mov of movimentacoes) {
      if (mov.contaId === conta.id) {
        if (mov.tipo === "entrada") {
          saldo += mov.valor;
        } else if (mov.tipo === "despesa" && mov.tipoPagamento !== "credito") {
          // Crédito não sai da conta na data da compra, só na fatura
          saldo -= mov.valor;
        } else if (mov.tipo === "transferencia") {
          saldo -= mov.valor;
        }
      }

      if (mov.tipo === "transferencia" && mov.contaDestinoId === conta.id) {
        saldo += mov.valor;
      }
    }

    return { ...conta, saldo };
  });

  const totalCpf = saldos.reduce((acc, c) => acc + c.saldo, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <Landmark className="h-4 w-4" />
        Saldo por conta
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {saldos.map((conta) => (
          <div
            key={conta.id}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-600">{conta.nome}</p>
            <p
              className={`mt-1 text-lg font-semibold tracking-tight ${
                conta.saldo >= 0 ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {formatCurrency(conta.saldo)}
            </p>
          </div>
        ))}
      </div>

      {saldos.length > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-medium text-slate-600">Total CPF</p>
          <p
            className={`text-lg font-semibold tracking-tight ${
              totalCpf >= 0 ? "text-emerald-600" : "text-rose-500"
            }`}
          >
            {formatCurrency(totalCpf)}
          </p>
        </div>
      )}
    </div>
  );
}
