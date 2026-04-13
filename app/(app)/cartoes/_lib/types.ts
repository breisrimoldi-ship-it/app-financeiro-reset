import type { ReactNode } from "react";

export type AbaCartoes = "visao" | "faturas" | "cartoes" | "ajustes";

export type Cartao = {
  id: number;
  nome: string;
  limite: number | string | null;
  fechamento_dia: number;
  vencimento_dia: number;
  created_at?: string;
};

export type DespesaCartao = {
  id: number;
  descricao?: string | null;
  valor: number;
  tipo: string;
  tipo_pagamento: string;
  categoria?: string | null;
  parcelas: number | null;
  primeira_cobranca: string | null;
  cartao_id: number | null;
  data: string;
};

export type PagamentoFatura = {
  id: number;
  cartao_id: number;
  mes_referencia: string;
  valor_pago: number;
  data_pagamento: string | null;
  status: string;
};

export type ParcelaProjetada = {
  despesaId: number;
  descricao: string;
  valor: number;
  parcelaAtual: number;
  totalParcelas: number;
  mes: string;
};

export type LinhaSaldoInicial = {
  mes: string;
  valor: string;
};

export type ModalPagamentoState = {
  aberto: boolean;
  cartaoId: number | null;
  cartaoNome: string;
  mesReferencia: string;
  valorTotal: number;
  valorPagoAtual: number;
  valorRestante: number;
};

export type ResumoCartao = {
  id: number;
  nome: string;
  limite: number;
  totalLancado: number;
  limiteDisponivel: number;
  percentualUso: number;
  quantidadeDespesas: number;
  totalParceladoFuturo: number;
};

export type DadosFaturaCartao = {
  cartao: Cartao;
  meses: MesFatura[];
  totalCartao: number;
  proximaFatura: MesFatura | null;
  faturaMesAtual: MesFatura | null;
  totalUsadoAtual: number;
  limiteDisponivel: number;
  percentualUso: number;
  estourado: boolean;
  competenciaProxima: string;
};

export type MesFatura = {
  mes: string;
  total: number;
  itens: ParcelaProjetada[];
  vencimento: string;
  status: string;
  pagamento: PagamentoFatura | null;
  valorPago: number;
  restante: number;
};

export type AbaButtonProps = {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
};

export type ResumoCardProps = {
  title: string;
  value: string;
  icon: ReactNode;
};

export type MiniResumoProps = {
  label: string;
  value: string;
};

export type MiniResumoBoxProps = {
  label: string;
  value: string;
  sublabel?: string;
  valueClassName?: string;
};

export type StatusInfoProps = {
  label: string;
  value: string;
  danger?: boolean;
  success?: boolean;
};

export type EmptyCardProps = {
  text: string;
};

export type FieldBlockProps = {
  label: string;
  htmlFor: string;
  children: ReactNode;
};
