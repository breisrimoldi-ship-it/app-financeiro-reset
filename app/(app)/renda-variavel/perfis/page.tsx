import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PerfisClient from "./ui";

type Perfil = {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
};

export default async function PerfisPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfis, error } = await supabase
    .from("rv_perfis")
    .select("id, nome, descricao, ativo, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return <PerfisClient perfis={(perfis ?? []) as Perfil[]} />;
}
