export type TipoRecorrencia = "indeterminada" | "temporaria";
export type AbaFiltro = "todas" | "ativas" | "inativas";
export type PrazoModo = "quantidade" | "fim";

export type ContaFixa = {
  id: number;
  descricao: string;
  valor: number;
  dia_vencimento: number;
  categoria: string | null;
  observacoes: string | null;
  ativa: boolean;
  user_id: string | null;
  tipo_recorrencia: TipoRecorrencia;
  inicio_cobranca: string | null;
  fim_cobranca: string | null;
  quantidade_meses: number | null;
  created_at: string;
  updated_at: string;
};

export type PagamentoConta = {
  id: number;
  origem_tipo: string;
  origem_id: number;
  mes_referencia: string;
  valor_pago: number;
  data_pagamento: string | null;
  status: string;
  observacoes?: string | null;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ResumoCardProps = {
  titulo: string;
  valor: string | number;
  descricao: string;
  icon: React.ReactNode;
  destaque?: "default" | "blue" | "amber" | "sky";
};

export type ContaCardProps = {
  conta: ContaFixa;
  mesSelecionado: string;
  pagamentoMes?: PagamentoConta;
  estaPagando: boolean;
  onEditar: () => void;
  onPagar: () => void;
  onDesfazerPagamento: () => void;
  onAlternarStatus: () => void;
  onExcluir: () => void;
};
