"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ContaInput = {
  id?: string;
  nome: string;
};

export async function salvarConta(input: ContaInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Usuário não autenticado.");
  if (!input.nome.trim()) throw new Error("Informe o nome da conta.");

  const nome = input.nome.trim();

  if (input.id) {
    const { error } = await supabase
      .from("rv_contas")
      .update({ nome })
      .eq("id", input.id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("rv_contas")
      .insert({ user_id: user.id, nome, ativo: true });

    if (error) throw new Error(error.message);
  }

  revalidatePath("/renda-variavel/contas");
  revalidatePath("/renda-variavel");
}

export async function toggleConta(id: string, ativo: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Usuário não autenticado.");

  const { error } = await supabase
    .from("rv_contas")
    .update({ ativo })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/renda-variavel/contas");
  revalidatePath("/renda-variavel");
}

export async function excluirConta(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Usuário não autenticado.");

  const { error } = await supabase
    .from("rv_contas")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/renda-variavel/contas");
  revalidatePath("/renda-variavel");
}
