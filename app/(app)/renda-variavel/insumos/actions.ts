"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type SaveInsumoInput = {
  id?: string;
  nome: string;
  categoriaId: string;
  unidade: string;
  valorBase: number;
};

export async function salvarInsumo(input: SaveInsumoInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const payload = {
    user_id: user.id,
    nome: input.nome.trim(),
    categoria_id: input.categoriaId,
    unidade: input.unidade.trim(),
    valor_base: input.valorBase,
    ativo: true,
    tipo_valor: "fixo",
  };

  if (!payload.nome) {
    throw new Error("Informe o nome do insumo.");
  }

  if (!payload.categoria_id) {
    throw new Error("Selecione a categoria.");
  }

  if (!payload.unidade) {
    throw new Error("Informe a unidade.");
  }

  if (payload.valor_base < 0) {
    throw new Error("O valor base não pode ser negativo.");
  }

  if (input.id) {
    const { error } = await supabase
      .from("rv_insumos")
      .update(payload)
      .eq("id", input.id)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase.from("rv_insumos").insert(payload);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/renda-variavel/insumos");
  revalidatePath("/renda-variavel/novo");
}

export async function excluirInsumo(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { error } = await supabase
    .from("rv_insumos")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/renda-variavel/insumos");
  revalidatePath("/renda-variavel/novo");
}