import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InsumosClient from "./ui";

type Categoria = {
  id: string;
  nome: string;
  ativo: boolean;
};

type Insumo = {
  id: string;
  nome: string;
  unidade: string;
  valor_base: number | null;
  categoria_id: string | null;
  ativo: boolean | null;
  tipo_valor: string | null;
  perfil_id: string | null;
};

export default async function InsumosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: categorias, error: categoriasError } = await supabase
    .from("rv_categorias_custo")
    .select("id, nome, ativo")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (categoriasError) {
    throw new Error(categoriasError.message);
  }

  const { data: insumos, error: insumosError } = await supabase
    .from("rv_insumos")
    .select(
      "id, nome, unidade, valor_base, categoria_id, ativo, tipo_valor, perfil_id"
    )
    .eq("user_id", user.id)
    .order("criado_em", { ascending: false });

  if (insumosError) {
    throw new Error(insumosError.message);
  }

  return (
    <InsumosClient
      categorias={(categorias ?? []) as Categoria[]}
      insumos={(insumos ?? []) as Insumo[]}
    />
  );
}