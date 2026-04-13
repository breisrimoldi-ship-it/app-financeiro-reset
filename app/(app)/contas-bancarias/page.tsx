import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContasBancariasClient from "./ui";

type ContaBancaria = {
  id: string;
  nome: string;
  tipo: string;
  saldo_inicial: number;
  ativo: boolean;
  created_at: string;
};

export default async function ContasBancariasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: contas, error } = await supabase
    .from("contas_bancarias")
    .select("id, nome, tipo, saldo_inicial, ativo, created_at")
    .eq("user_id", user.id)
    .order("tipo", { ascending: true })
    .order("nome", { ascending: true });

  const tabelaInexistente = error?.message?.includes("contas_bancarias");

  if (error && !tabelaInexistente) {
    throw new Error(error.message);
  }

  return (
    <ContasBancariasClient
      contas={(contas ?? []) as ContaBancaria[]}
      precisaMigracao={Boolean(tabelaInexistente)}
    />
  );
}
