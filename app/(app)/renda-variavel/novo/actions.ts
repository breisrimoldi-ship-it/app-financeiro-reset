"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ItemInput = {
  insumoNome: string;
  unidade: string;
  valorBase: number;
  quantidade: number;
  total: number;
};

type CustoDetalhadoInput = {
  categoriaId: string | null;
  categoriaNome: string;
  descricao: string;
  valor: number;
};

type LancamentoInput = {
  data: string;
  descricao: string;
  perfil: string;
  cliente: string;
  valorRecebido: number;
  horasTrabalhadas: number;
  quantidade: number;
  observacao?: string;
  custoManualDescricao: string;
  custoManualValor: number;
  custoInsumos: number;
  custoTotal: number;
  lucroLiquido: number;
  lucroPorHora: number;
  margem: number;
  itens: ItemInput[];
  custosDetalhados?: CustoDetalhadoInput[];
};

export async function criarLancamentosRendaVariavel(
  lancamentos: LancamentoInput[]
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    if (!Array.isArray(lancamentos) || lancamentos.length === 0) {
      throw new Error("Nenhum lançamento para salvar.");
    }

    for (const input of lancamentos) {
      if (!input.data) {
        throw new Error("Informe a data.");
      }

      if (!input.descricao.trim()) {
        throw new Error("Informe a descrição.");
      }

      if (input.valorRecebido <= 0) {
        throw new Error("Informe um valor recebido maior que zero.");
      }

      const { data: lancamento, error: lancamentoError } = await supabase
        .from("rv_lancamentos")
        .insert({
          user_id: user.id,
          data: input.data,
          descricao: input.descricao.trim(),
          perfil: input.perfil || null,
          cliente: input.cliente.trim() || null,
          valor_recebido: input.valorRecebido,
          horas_trabalhadas: input.horasTrabalhadas,
          quantidade: input.quantidade,
          custo_manual_descricao: input.custoManualDescricao.trim() || null,
          custo_manual_valor: input.custoManualValor,
          custo_insumos: input.custoInsumos,
          custo_total: input.custoTotal,
          lucro_liquido: input.lucroLiquido,
          lucro_por_hora: input.lucroPorHora,
          margem: input.margem,
        })
        .select("id")
        .single();

      if (lancamentoError) {
        throw new Error(
          `rv_lancamentos: ${lancamentoError.message} | details: ${lancamentoError.details ?? "-"} | hint: ${lancamentoError.hint ?? "-"}`
        );
      }

      const itensValidos = input.itens.filter((item) => item.quantidade > 0);

      if (itensValidos.length > 0) {
        const { error: itensError } = await supabase
          .from("rv_lancamento_itens")
          .insert(
           itensValidos.map((item) => ({
  user_id: user.id,
  lancamento_id: lancamento.id,
  insumo_nome: item.insumoNome,
  nome_snapshot: item.insumoNome,
  unidade: item.unidade,
  unidade_snapshot: item.unidade,
  valor_base: item.valorBase,
  valor_snapshot: item.valorBase,
  quantidade: item.quantidade,
  total: item.total,
}))
          );

        if (itensError) {
          throw new Error(
            `rv_lancamento_itens: ${itensError.message} | details: ${itensError.details ?? "-"} | hint: ${itensError.hint ?? "-"}`
          );
        }
      }

      const custosDetalhadosValidos = (input.custosDetalhados ?? []).filter(
        (custo) => custo.categoriaNome.trim() && custo.valor > 0
      );

      if (custosDetalhadosValidos.length > 0) {
        const { error: custosError } = await supabase
          .from("rv_lancamento_custos")
          .insert(
            custosDetalhadosValidos.map((custo) => ({
              user_id: user.id,
              lancamento_id: lancamento.id,
              categoria_id: custo.categoriaId,
              categoria_nome: custo.categoriaNome.trim(),
              descricao: custo.descricao.trim() || null,
              valor: custo.valor,
            }))
          );

        if (custosError) {
          throw new Error(
            `rv_lancamento_custos: ${custosError.message} | details: ${custosError.details ?? "-"} | hint: ${custosError.hint ?? "-"}`
          );
        }
      }
    }

    revalidatePath("/renda-variavel");
    redirect("/renda-variavel");
  } catch (error) {
    console.error("Erro completo ao salvar renda variável:", error);
    throw error;
  }
}