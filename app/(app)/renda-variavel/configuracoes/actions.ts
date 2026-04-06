"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ConfigInput = {
  perfilPadraoId: string | null;
  horasPadrao: string;
  metaMensal: number | null;
  moeda: string;
};

export async function salvarConfiguracoes(input: ConfigInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Usuário não autenticado.");

  const payload = {
    user_id: user.id,
    perfil_padrao_id: input.perfilPadraoId || null,
    horas_padrao: input.horasPadrao.trim() || null,
    meta_mensal:
      input.metaMensal != null && Number.isFinite(input.metaMensal)
        ? input.metaMensal
        : null,
    moeda: input.moeda || "BRL",
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("rv_configuracoes")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("rv_configuracoes")
      .update(payload)
      .eq("id", existing.id);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("rv_configuracoes")
      .insert(payload);

    if (error) throw new Error(error.message);
  }

  revalidatePath("/renda-variavel/configuracoes");
  revalidatePath("/renda-variavel");
}
