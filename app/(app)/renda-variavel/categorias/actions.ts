"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type CategoriaInput = {
  nome: string;
  descricaoPadrao?: string;
  valorPadrao?: number | null;
  usarValorPadrao?: boolean;
};

export async function criarCategoria(input: CategoriaInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Usuário não autenticado");

  if (!input.nome.trim()) throw new Error("Nome obrigatório");

  const { error } = await supabase.from("rv_categorias_custo").insert({
    user_id: user.id,
    nome: input.nome.trim(),
    descricao_padrao: input.descricaoPadrao?.trim() || null,
    valor_padrao:
      typeof input.valorPadrao === "number" && !Number.isNaN(input.valorPadrao)
        ? input.valorPadrao
        : null,
    usar_valor_padrao: Boolean(input.usarValorPadrao),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/renda-variavel/categorias");
}

export async function atualizarCategoria(
  id: string,
  input: CategoriaInput
) {
  const supabase = await createClient();

  if (!input.nome.trim()) throw new Error("Nome obrigatório");

  const { error } = await supabase
    .from("rv_categorias_custo")
    .update({
      nome: input.nome.trim(),
      descricao_padrao: input.descricaoPadrao?.trim() || null,
      valor_padrao:
        typeof input.valorPadrao === "number" && !Number.isNaN(input.valorPadrao)
          ? input.valorPadrao
          : null,
      usar_valor_padrao: Boolean(input.usarValorPadrao),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/renda-variavel/categorias");
}

export async function toggleCategoria(id: string, ativo: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("rv_categorias_custo")
    .update({ ativo })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/renda-variavel/categorias");
}

export async function deletarCategoria(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("rv_categorias_custo")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/renda-variavel/categorias");
}