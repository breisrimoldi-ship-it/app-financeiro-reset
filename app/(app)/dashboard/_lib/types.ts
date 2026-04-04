export type PaymentType = "pix_dinheiro" | "debito" | "credito";
export type FormType = "entrada" | "despesa";

export type Movimentacao = {
  id: number;
  created_at: string;
  tipo: string | null;
  descricao: string | null;
  categoria: string | null;
  valor: number | string | null;
  data: string | null;
  tipo_pagamento: string | null;
  cartao_id: number | null;
  parcelas: number | null;
  primeira_cobranca: string | null;
  meta_id?: string | null;
  meta_aporte_id?: string | null;
};

export type FaturaPagamento = {
  id: number;
  cartao_id: number;
  mes_referencia: string;
  valor_pago: number | string | null;
  data_pagamento: string | null;
  status: string | null;
};

export type Cartao = {
  id: number;
  nome: string;
  fechamento_dia: number | null;
  vencimento_dia: number | null;
  limite: number | string | null;
};

export type ContaFixaDashboard = {
  id: number;
  descricao: string;
  valor: number | string | null;
  dia_vencimento: number | null;
  categoria: string | null;
  observacoes: string | null;
  ativa: boolean;
  user_id: string | null;
  tipo_recorrencia: "indeterminada" | "temporaria";
  inicio_cobranca: string | null;
  fim_cobranca: string | null;
  quantidade_meses: number | null;
  created_at: string;
  updated_at: string;
};

export type PagamentoContaDashboard = {
  id: number;
  origem_tipo: string | null;
  origem_id: number | null;
  mes_referencia: string | null;
  valor_pago: number | string | null;
  data_pagamento: string | null;
  status: string | null;
  observacoes: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ResumoCartao = {
  id: number;
  nome: string;
  limite: number;
  emAberto: number;
};

export type ChartPoint = {
  mes: string;
  label: string;
  entradas: number;
  saidas: number;
  saldo: number;
};

export type MetaResumo = {
  id?: string;
  nome: string;
  valorMeta: number;
  valorAtual: number;
  faltante: number;
  percentual: number;
  prazo: string | null;
};

export type MetasSnapshot = {
  totalGuardado: number;
  quantidadeAtivas: number;
  metaMaisProxima: MetaResumo | null;
  metasOrdenadas: MetaResumo[];
};

export type MetaPlanoRadar = {
  id: string;
  nome: string;
  prazo: string | null;
  faltante: number;
  valorPorDia: number;
  valorSugeridoHoje: number;
  percentual: number;
  prioridade: number;
};

export type MonthSnapshot = {
  saldoInicial: number;
  entradas: number;
  saidasPagas: number;
  comprometidoMes: number;
  comprometidoAtrasado: number;
  comprometido: number;
  saldoDisponivel: number;
  adiantadas: number;
  cartoesResumo: ResumoCartao[];
};

export type CardAtivo =
  | "entradas"
  | "saidas"
  | "comprometido"
  | "adiantadas"
  | "contas"
  | null;

export type ModalLancamentoItem = {
  id: string;
  tipo: "entrada" | "despesa" | "fatura" | "adiantada" | "conta";
  titulo: string;
  categoria: string;
  valor: number;
  dataPrincipal: string;
  pagamentoLabel?: string;
  cartaoNome?: string;
  competencia?: string;
};

export type ActionFormData = {
  descricao: string;
  categoria: string;
  valor: string;
  data: string;
  tipoPagamento: PaymentType;
  cartaoId: string;
  parcelas: string;
  primeiraCobranca: string;
};

export type RecomendacaoAcao = {
  tipo: "guardar_meta";
  valor: number;
  metaId: string;
  metaNome: string;
};

export type RecomendacaoItem = {
  tipo: "acao" | "alerta";
  texto: string;
  acao?: RecomendacaoAcao;
};

export type MetaRecord = Record<string, unknown>;
export type MetaAporteRecord = Record<string, unknown>;
