import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContasClient from "./ui";

type Conta = {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
};

export default async function ContasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: contas, error } = await supabase
    .from("rv_contas")
    .select("id, nome, ativo, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const tabelaInexistente = error?.message?.includes("rv_contas");

  if (error && !tabelaInexistente) {
    throw new Error(error.message);
  }

  return (
    <ContasClient
      contas={(contas ?? []) as Conta[]}
      precisaMigracao={Boolean(tabelaInexistente)}
    />
  );
}
