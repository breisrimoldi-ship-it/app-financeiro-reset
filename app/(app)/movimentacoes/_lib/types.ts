export type FormType = "entrada" | "despesa";
export type MovimentacaoTipo = FormType | "transferencia";
export type TabType = "entradas" | "despesas";
export type PaymentType = "pix_dinheiro" | "debito" | "credito";

export type Cartao = {
  id: number;
  nome: string;
  fechamentoDia: number;
  vencimentoDia: number;
};

export type Movimentacao = {
  id: number;
  created_at?: string;
  tipo: MovimentacaoTipo;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  tipoPagamento?: PaymentType | null;
  cartaoId?: number | null;
  parcelas?: number | null;
  primeiraCobranca?: string | null;
  metaId?: string | null;
  metaAporteId?: string | null;
  rvTransferenciaId?: string | null;
  contaId?: string | null;
  contaDestinoId?: string | null;
};

export type DbMovimentacao = {
  id: number;
  created_at: string;
  tipo: MovimentacaoTipo;
  descricao: string;
  categoria: string;
  valor: number | string;
  data: string;
  tipo_pagamento: PaymentType | null;
  cartao_id: number | null;
  parcelas: number | null;
  primeira_cobranca: string | null;
  meta_id: string | null;
  meta_aporte_id: string | null;
  rv_transferencia_id: string | null;
  conta_id: string | null;
  conta_destino_id: string | null;
};

export type DbCartao = {
  id: number;
  nome: string;
  fechamento_dia: number;
  vencimento_dia: number;
};

export type CategoryOption = {
  id: string;
  label: string;
  slug?: string;
  ordem?: number;
};

export type DbMovimentacaoCategoria = {
  id: string;
  tipo: FormType;
  nome: string;
  slug: string;
  ordem: number | null;
  ativa: boolean;
};

export type CategoryManagerTab = "entrada" | "despesa";

export type ContaBancaria = {
  id: string;
  nome: string;
  tipo: string;
};

export type FormData = {
  descricao: string;
  categoria: string;
  valor: string;
  data: string;
  tipoPagamento: PaymentType;
  cartaoId: string;
  parcelas: string;
  primeiraCobranca: string;
  contaId: string;
};
