export type TipoRvLancamento =
  | "receita_bruta"
  | "taxa_financeira"
  | "despesa_operacional"
  | "transferencia_para_cpf"
  | "aporte_cpf_para_pj";

export const TIPO_RV_LABEL: Record<TipoRvLancamento, string> = {
  receita_bruta: "Receita bruta",
  taxa_financeira: "Taxa financeira",
  despesa_operacional: "Despesa operacional",
  transferencia_para_cpf: "Transferência para CPF",
  aporte_cpf_para_pj: "Aporte CPF → PJ",
};

export function isEntradaTipo(tipo: TipoRvLancamento) {
  return tipo === "receita_bruta" || tipo === "aporte_cpf_para_pj";
}

export function addTipoPrefix(tipo: TipoRvLancamento, descricao: string) {
  return `[${tipo}] ${descricao.trim()}`;
}

export function parseTipoFromDescricao(descricao: string): TipoRvLancamento | null {
  const m = descricao.match(/^\[(.+?)\]\s*/);
  if (!m) return null;
  const tipo = m[1] as TipoRvLancamento;
  const validos: TipoRvLancamento[] = [
    "receita_bruta",
    "taxa_financeira",
    "despesa_operacional",
    "transferencia_para_cpf",
    "aporte_cpf_para_pj",
  ];
  return validos.includes(tipo) ? tipo : null;
}