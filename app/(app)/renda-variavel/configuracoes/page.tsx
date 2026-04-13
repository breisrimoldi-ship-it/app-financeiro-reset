import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ConfiguracoesClient from "./ui";

type Perfil = {
  id: string;
  nome: string;
};

type Configuracao = {
  perfil_padrao_id: string | null;
  horas_padrao: string | null;
  meta_mensal: number | null;
  moeda: string;
};

export default async function ConfiguracoesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfis, error: perfisError } = await supabase
    .from("rv_perfis")
    .select("id, nome")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (perfisError) {
    throw new Error(perfisError.message);
  }

  const { data: config, error: configError } = await supabase
    .from("rv_configuracoes")
    .select("perfil_padrao_id, horas_padrao, meta_mensal, moeda")
    .eq("user_id", user.id)
    .single();

  if (configError && configError.code !== "PGRST116") {
    throw new Error(configError.message);
  }

  return (
    <ConfiguracoesClient
      perfis={(perfis ?? []) as Perfil[]}
      config={(config as Configuracao) ?? null}
    />
  );
}
