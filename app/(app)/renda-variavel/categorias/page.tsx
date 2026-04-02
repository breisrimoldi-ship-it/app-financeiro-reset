import { createClient } from "@/lib/supabase/server";
import CategoriasClient from "./ui";

type CategoriaCusto = {
  id: string;
  user_id: string;
  nome: string;
  ativo: boolean;
  descricao_padrao: string | null;
  valor_padrao: number | null;
  usar_valor_padrao: boolean;
  created_at: string;
};

export default async function CategoriasPage() {
  const supabase = await createClient();

  const { data: categorias, error } = await supabase
    .from("rv_categorias_custo")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <CategoriasClient
      categorias={(categorias ?? []) as CategoriaCusto[]}
    />
  );
}