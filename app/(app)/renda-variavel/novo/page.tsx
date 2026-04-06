import { createClient } from "@/lib/supabase/server";
import NovoLancamentoClient from "./ui";

type CategoriaCusto = {
  id: string;
  nome: string;
  ativo: boolean;
  descricao_padrao: string | null;
  valor_padrao: number | null;
  usar_valor_padrao: boolean;
};

type Insumo = {
  id: string;
  nome: string;
  unidade: string;
  valor_base: number | null;
  categoria_id: string | null;
  ativo: boolean | null;
};

type Perfil = {
  id: string;
  nome: string;
};

export default async function NovoLancamentoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data: categorias, error: categoriasError } = await supabase
    .from("rv_categorias_custo")
    .select("id, nome, ativo, descricao_padrao, valor_padrao, usar_valor_padrao")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (categoriasError) {
    throw new Error(categoriasError.message);
  }

  const { data: insumos, error: insumosError } = await supabase
    .from("rv_insumos")
    .select("id, nome, unidade, valor_base, categoria_id, ativo")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (insumosError) {
    throw new Error(insumosError.message);
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

  return (
    <NovoLancamentoClient
      categorias={(categorias ?? []) as CategoriaCusto[]}
      insumos={(insumos ?? []) as Insumo[]}
      perfis={(perfis ?? []) as Perfil[]}
    />
  );
}