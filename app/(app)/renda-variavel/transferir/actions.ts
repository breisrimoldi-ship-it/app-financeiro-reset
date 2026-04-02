"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function getMesRange(competencia: string) {
  const [ano, mes] = competencia.split("-").map(Number);
  const inicio = `${competencia}-01`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const fim = `${competencia}-${String(ultimoDia).padStart(2, "0")}`;
  return { inicio, fim };
}

export async function transferirSaldoRendaVariavel(input: {
  competencia: string;
  dataTransferencia: string;
  valor: number;
  descricao?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  if (!input.competencia) {
    throw new Error("Competência inválida.");
  }

  if (!input.dataTransferencia) {
    throw new Error("Informe a data da transferência.");
  }

  if (!Number.isFinite(input.valor) || input.valor <= 0) {
    throw new Error("Informe um valor válido para transferir.");
  }

  const { inicio, fim } = getMesRange(input.competencia);

  const { data: lancamentos, error: lancamentosError } = await supabase
    .from("rv_lancamentos")
    .select("lucro_liquido")
    .eq("user_id", user.id)
    .gte("data", inicio)
    .lte("data", fim);

  if (lancamentosError) {
    throw new Error(lancamentosError.message);
  }

  const { data: transferencias, error: transferenciasError } = await supabase
    .from("rv_transferencias")
    .select("valor")
    .eq("user_id", user.id)
    .eq("competencia", input.competencia);

  if (transferenciasError) {
    throw new Error(transferenciasError.message);
  }

  const lucroMes = (lancamentos ?? []).reduce(
    (acc, item) => acc + Number(item.lucro_liquido ?? 0),
    0
  );

  const jaTransferido = (transferencias ?? []).reduce(
    (acc, item) => acc + Number(item.valor ?? 0),
    0
  );

  const disponivel = lucroMes - jaTransferido;

  if (input.valor > disponivel) {
    throw new Error("O valor informado é maior que o saldo disponível para transferência.");
  }

  const descricaoFinal =
    input.descricao?.trim() || `Transferência da renda variável (${input.competencia})`;

  const { data: transferenciaCriada, error: transferenciaError } = await supabase
    .from("rv_transferencias")
    .insert({
      user_id: user.id,
      competencia: input.competencia,
      data_transferencia: input.dataTransferencia,
      origem: "renda_variavel",
      destino: "financeiro_geral",
      valor: input.valor,
      descricao: descricaoFinal,
    })
    .select("id")
    .single();

  if (transferenciaError) {
    throw new Error(transferenciaError.message);
  }

  const { error: movimentacaoError } = await supabase
    .from("movimentacoes")
    .insert({
      tipo: "entrada",
      descricao: descricaoFinal,
      categoria: "transferencia_renda_variavel",
      valor: input.valor,
      data: input.dataTransferencia,
      tipo_pagamento: null,
      cartao_id: null,
      parcelas: null,
      primeira_cobranca: null,
      rv_transferencia_id: transferenciaCriada.id,
    });

  if (movimentacaoError) {
    throw new Error(movimentacaoError.message);
  }

  revalidatePath("/renda-variavel");
  revalidatePath("/renda-variavel/transferir");
  revalidatePath("/movimentacoes");
  revalidatePath("/dashboard");
}