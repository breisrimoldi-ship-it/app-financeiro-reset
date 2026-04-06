export type CategoriaCusto = {
  id: string;
  nome: string;
  ativo: boolean;
  descricao_padrao: string | null;
  valor_padrao: number | null;
  usar_valor_padrao: boolean;
};

export type Perfil = {
  id: string;
  nome: string;
};

export type Insumo = {
  id: string;
  nome: string;
  unidade: string;
  valor_base: number | null;
  categoria_id: string | null;
  ativo: boolean | null;
};

export type TipoLancamento = "unico" | "intervalo";
export type ModoIntervalo = "resumo" | "dia-a-dia";

export type CustoDia = {
  id: string;
  categoriaId: string;
  descricao: string;
  valor: string;
};

export type DiaDetalhado = {
  data: string;
  ativo: boolean;
  descricao: string;
  valorRecebido: string;
  horas: string;
  quantidade: string;
  observacao: string;
  custos: CustoDia[];
};

export type InsumoSelecionado = {
  id: string;
  insumoId: string;
  quantidade: string;
  valorUnitario: string;
};

export type CustoManualItem = {
  id: string;
  categoriaId: string;
  descricao: string;
  valor: string;
};

export type Props = {
  categorias: CategoriaCusto[];
  insumos: Insumo[];
};
