import type { TipoRvLancamento } from "./tipos";

export type LancamentoRow = {
  id: string;
  data: string;
  descricao: string;
  perfil: string | null;
  valor_recebido: number | null;
  custo_total: number | null;
  lucro_liquido: number | null;
  lucro_por_hora: number | null;
};

export type TransferenciaRow = {
  valor: number | null;
};

export type LancamentoHistoricoRow = {
  data: string;
  descricao: string;
  valor_recebido: number | null;
  custo_total: number | null;
};

export type TransferenciaHistoricoRow = {
  data_transferencia: string;
  valor: number | null;
};

export type SerieMensal = {
  mes: string;
  receitas: number;
  aportes: number;
  custos: number;
  transferencias: number;
  lucroLiquido: number;
};

export type FiltroTipo = "todos" | TipoRvLancamento;

export type PageProps = {
  searchParams?: Promise<{
    mes?: string;
    tipo?: FiltroTipo;
    meta?: string;
  }>;
};
