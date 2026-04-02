import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TransferirClient from "./ui";

type TransferenciaRow = {
  id: string;
  competencia: string;
  data_transferencia: string;
  valor: number | string;
  destino: string;
  descricao: string | null;
  created_at: string;
};

type LancamentoRow = {
  id: string;
  data: string;
  lucro_liquido: number | string | null;
};

function getMesAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

function formatCompetenciaLabel(competencia: string) {
  const [ano, mes] = competencia.split("-");
  if (!ano || !mes) return competencia;
  return `${mes}/${ano}`;
}

export default async function TransferirPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const competenciaAtual = getMesAtual();
  const inicio = `${competenciaAtual}-01`;

  const [ano, mes] = competenciaAtual.split("-").map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const fim = `${competenciaAtual}-${String(ultimoDia).padStart(2, "0")}`;

  const { data: lancamentos, error: lancamentosError } = await supabase
    .from("rv_lancamentos")
    .select("id, data, lucro_liquido")
    .eq("user_id", user.id)
    .gte("data", inicio)
    .lte("data", fim);

  if (lancamentosError) {
    throw new Error(lancamentosError.message);
  }

  const { data: transferencias, error: transferenciasError } = await supabase
    .from("rv_transferencias")
    .select("id, competencia, data_transferencia, valor, destino, descricao, created_at")
    .eq("user_id", user.id)
    .eq("competencia", competenciaAtual)
    .order("created_at", { ascending: false });

  if (transferenciasError) {
    throw new Error(transferenciasError.message);
  }

  const lucroMes = ((lancamentos ?? []) as LancamentoRow[]).reduce(
    (acc, item) => acc + Number(item.lucro_liquido ?? 0),
    0
  );

  const transferidoMes = ((transferencias ?? []) as TransferenciaRow[]).reduce(
    (acc, item) => acc + Number(item.valor ?? 0),
    0
  );

  const disponivel = Math.max(lucroMes - transferidoMes, 0);

  return (
    <TransferirClient
      competenciaAtual={competenciaAtual}
      competenciaLabel={formatCompetenciaLabel(competenciaAtual)}
      lucroMes={lucroMes}
      transferidoMes={transferidoMes}
      disponivel={disponivel}
      historico={(transferencias ?? []) as TransferenciaRow[]}
    />
  );
}