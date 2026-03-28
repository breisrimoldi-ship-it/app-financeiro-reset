export type CategoryType = "entrada" | "despesa";

export type FinanceCategory = {
  id: string;
  label: string;
  type: CategoryType;
};

export const FINANCE_CATEGORIES: FinanceCategory[] = [
  // Entradas
  { id: "salario", label: "Salário", type: "entrada" },
  { id: "uber", label: "Uber", type: "entrada" },
  { id: "freelance", label: "Freelance", type: "entrada" },
  { id: "vendas", label: "Vendas", type: "entrada" },
  { id: "reembolso", label: "Reembolso", type: "entrada" },
  { id: "rendimentos", label: "Rendimentos", type: "entrada" },
  { id: "outros_entrada", label: "Outros", type: "entrada" },

  // Despesas
  { id: "alimentacao", label: "Alimentação", type: "despesa" },
  { id: "mercado", label: "Mercado", type: "despesa" },
  { id: "moradia", label: "Moradia", type: "despesa" },
  { id: "agua", label: "Água", type: "despesa" },
  { id: "energia", label: "Energia", type: "despesa" },
  { id: "internet", label: "Internet", type: "despesa" },
  { id: "telefone", label: "Telefone", type: "despesa" },
  { id: "transporte", label: "Transporte", type: "despesa" },
  { id: "combustivel", label: "Combustível", type: "despesa" },
  { id: "manutencao", label: "Manutenção", type: "despesa" },
  { id: "saude", label: "Saúde", type: "despesa" },
  { id: "farmacia", label: "Farmácia", type: "despesa" },
  { id: "lazer", label: "Lazer", type: "despesa" },
  { id: "assinaturas", label: "Assinaturas", type: "despesa" },
  { id: "educacao", label: "Educação", type: "despesa" },
  { id: "cartao_credito", label: "Cartão de crédito", type: "despesa" },
  { id: "impostos", label: "Impostos", type: "despesa" },
  { id: "outros_despesa", label: "Outros", type: "despesa" },
];

export function getCategoryOptions(type: CategoryType): FinanceCategory[] {
  return FINANCE_CATEGORIES.filter((category) => category.type === type);
}

export function getCategoryLabel(categoryId: string): string {
  const found = FINANCE_CATEGORIES.find((category) => category.id === categoryId);
  return found?.label ?? categoryId;
}