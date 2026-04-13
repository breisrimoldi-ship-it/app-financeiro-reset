export type MetaStatus = "ativa" | "pausada" | "concluida" | "cancelada";
export type MetaPrioridade = 1 | 2 | 3;
export type MetaAporteTipo = "aporte" | "retirada" | "ajuste";

export type MetaRow = {
  id: string;
  user_id: string;
  nome: string;
  descricao: string | null;
  tipo: string | null;
  valor_meta: number | string;
  valor_inicial: number | string;
  valor_atual: number | string | null;
  cor: string | null;
  icone: string | null;
  prazo: string | null;
  prioridade: number;
  status: MetaStatus;
  considerar_na_dashboard: boolean;
  created_at: string;
  updated_at: string;
};

export type MetaAporteRow = {
  id: string;
  user_id: string;
  meta_id: string;
  tipo: MetaAporteTipo;
  valor: number | string;
  descricao: string | null;
  data: string;
  created_at: string;
};

export type MetaCalculada = MetaRow & {
  valorMetaNumero: number;
  valorInicialNumero: number;
  valorAtualCalculado: number;
  faltante: number;
  percentual: number;
  aportesDaMeta: MetaAporteRow[];
  prazoFormatado: string;
  prioridadeLabel: string;
  totalAportado: number;
  mediaMensalAportes: number;
  mesesRestantes: number | null;
  valorIdealMensal: number | null;
  previsaoConclusaoTexto: string;
};

export type MetaFormState = {
  nome: string;
  descricao: string;
  tipo: string;
  valorMeta: string;
  valorInicial: string;
  prazo: string;
  prioridade: MetaPrioridade;
  status: MetaStatus;
  considerarNaDashboard: boolean;
};

export type AporteFormState = {
  tipo: MetaAporteTipo;
  valor: string;
  descricao: string;
  data: string;
};

export type InteligenciaMetas = {
  maisProxima: MetaCalculada;
  maisAtrasada: MetaCalculada;
  maisUrgente: MetaCalculada;
  valorSugerido: number;
};

export type ResumoMetas = {
  totalGuardado: number;
  metasAtivas: number;
  metasConcluidas: number;
  aporteMes: number;
  metaMaisProxima: MetaCalculada | undefined;
};
