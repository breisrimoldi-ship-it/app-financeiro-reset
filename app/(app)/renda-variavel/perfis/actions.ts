"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type PerfilInput = {
  id?: string;
  nome: string;
  descricao: string;
};

export async function salvarPerfil(input: PerfilInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Usuário não autenticado.");
  if (!input.nome.trim()) throw new Error("Informe o nome do perfil.");

  const payload = {
    user_id: user.id,
    nome: input.nome.trim(),
    descricao: input.descricao.trim() || null,
    ativo: true,
  };

  if (input.id) {
    const { error } = await supabase
      .from("rv_perfis")
      .update({ nome: payload.nome, descricao: payload.descricao })
      .eq("id", input.id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("rv_perfis").insert(payload);

    if (error) throw new Error(error.message);
  }

  revalidatePath("/renda-variavel/perfis");
  revalidatePath("/renda-variavel/novo");
}

export async function togglePerfil(id: string, ativo: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Usuário não autenticado.");

  const { error } = await supabase
    .from("rv_perfis")
    .update({ ativo })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/renda-variavel/perfis");
}

export async function excluirPerfil(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Usuário não autenticado.");

  const { error } = await supabase
    .from("rv_perfis")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/renda-variavel/perfis");
  revalidatePath("/renda-variavel/novo");
}
