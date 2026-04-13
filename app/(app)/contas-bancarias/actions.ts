"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ContaInput = {
  id?: string;
  nome: string;
  tipo: "cpf" | "pj";
  saldoInicial?: number;
};

export async function salvarContaBancaria(input: ContaInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Usuário não autenticado.");
  if (!input.nome.trim()) throw new Error("Informe o nome da conta.");

  const nome = input.nome.trim();
  const saldoInicial = input.saldoInicial ?? 0;

  if (input.id) {
    const { error } = await supabase
      .from("contas_bancarias")
      .update({ nome, tipo: input.tipo, saldo_inicial: saldoInicial })
      .eq("id", input.id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("contas_bancarias")
      .insert({
        user_id: user.id,
        nome,
        tipo: input.tipo,
        saldo_inicial: saldoInicial,
        ativo: true,
      });

    if (error) throw new Error(error.message);
  }

  revalidatePath("/contas-bancarias");
  revalidatePath("/renda-variavel");
  revalidatePath("/movimentacoes");
  revalidatePath("/dashboard");
}

export async function toggleContaBancaria(id: string, ativo: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Usuário não autenticado.");

  const { error } = await supabase
    .from("contas_bancarias")
    .update({ ativo })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/contas-bancarias");
  revalidatePath("/renda-variavel");
}

export async function excluirContaBancaria(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Usuário não autenticado.");

  const { error } = await supabase
    .from("contas_bancarias")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/contas-bancarias");
  revalidatePath("/renda-variavel");
}
