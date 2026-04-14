import type {
  Cartao,
  DbMovimentacao,
  FormData,
  Movimentacao,
  PaymentType,
} from "./types";

export const CATEGORIAS_PADRAO_ENTRADA = [
  { nome: "Salário", slug: "salario", ordem: 1 },
  { nome: "Uber", slug: "uber", ordem: 2 },
  { nome: "Freelance", slug: "freelance", ordem: 3 },
  { nome: "Vendas", slug: "vendas", ordem: 4 },
  { nome: "Reembolso", slug: "reembolso", ordem: 5 },
  { nome: "Rendimentos", slug: "rendimentos", ordem: 6 },
  { nome: "Outros", slug: "outros_entrada", ordem: 99 },
] as const;

export const CATEGORIAS_PADRAO_DESPESA = [
  { nome: "Alimentação", slug: "alimentacao", ordem: 1 },
  { nome: "Mercado", slug: "mercado", ordem: 2 },
  { nome: "Moradia", slug: "moradia", ordem: 3 },
  { nome: "Água", slug: "agua", ordem: 4 },
  { nome: "Energia", slug: "energia", ordem: 5 },
  { nome: "Internet", slug: "internet", ordem: 6 },
  { nome: "Telefone", slug: "telefone", ordem: 7 },
  { nome: "Transporte", slug: "transporte", ordem: 8 },
  { nome: "Combustível", slug: "combustivel", ordem: 9 },
  { nome: "Manutenção", slug: "manutencao", ordem: 10 },
  { nome: "Saúde", slug: "saude", ordem: 11 },
  { nome: "Farmácia", slug: "farmacia", ordem: 12 },
  { nome: "Lazer", slug: "lazer", ordem: 13 },
  { nome: "Assinaturas", slug: "assinaturas", ordem: 14 },
  { nome: "Educação", slug: "educacao", ordem: 15 },
  { nome: "Cartão de crédito", slug: "cartao_de_credito", ordem: 16 },
  { nome: "Impostos", slug: "impostos", ordem: 17 },
  { nome: "Outros", slug: "outros_despesa", ordem: 99 },
] as const;

export function getInitialFormData(): FormData {
  return {
    descricao: "",
    categoria: "",
    valor: "",
    data: "",
    tipoPagamento: "pix_dinheiro" as PaymentType,
    cartaoId: "",
    parcelas: "",
    primeiraCobranca: "",
    contaId: "",
  };
}

export function mapDbToUi(item: DbMovimentacao): Movimentacao {
  return {
    id: item.id,
    created_at: item.created_at,
    tipo: item.tipo,
    descricao: item.descricao,
    categoria: item.categoria,
    valor: Number(item.valor),
    data: item.data,
    tipoPagamento: item.tipo_pagamento,
    cartaoId: item.cartao_id,
    parcelas: item.parcelas,
    primeiraCobranca: item.primeira_cobranca,
    metaId: item.meta_id,
    metaAporteId: item.meta_aporte_id,
    rvTransferenciaId: item.rv_transferencia_id,
    contaId: item.conta_id,
    contaDestinoId: item.conta_destino_id,
  };
}

export function resolveCategoryLabel(
  categoriaId: string,
  options?:
    | Array<{ id: string; label: string }>
    | Array<{ slug: string; nome: string }>
) {
  if (!categoriaId) return "Sem categoria";

  if (!options) return categoriaId;

  const found = options.find((item) =>
    "id" in item ? item.id === categoriaId : item.slug === categoriaId
  );

  if (!found) return categoriaId;

  return "label" in found ? found.label : found.nome;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function getMesAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

export function calcularPrimeiraCobranca(
  dataCompra: string,
  cartaoId: number,
  cartoes: Cartao[]
) {
  const cartao = cartoes.find((item) => item.id === cartaoId);
  if (!cartao || !dataCompra) return "";

  const [ano, mes, dia] = dataCompra.split("-").map(Number);
  if (!ano || !mes || !dia) return "";

  let anoCobranca = ano;
  let mesCobranca = mes;

  if (dia > cartao.fechamentoDia) {
    if (mes === 12) {
      anoCobranca = ano + 1;
      mesCobranca = 1;
    } else {
      mesCobranca = mes + 1;
    }
  }

  return `${anoCobranca}-${String(mesCobranca).padStart(2, "0")}`;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(dateString: string) {
  if (!dateString) return "--/--/----";
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

export function formatCompetencia(value: string) {
  if (!value) return "-";
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  return `${month}/${year}`;
}

export function formatTipoPagamento(tipo: PaymentType) {
  if (tipo === "credito") return "Cartão de Crédito";
  if (tipo === "debito") return "Cartão de Débito";
  return "PIX / Dinheiro";
}

export function getDataLabel(data: string) {
  const hoje = new Date();
  const hojeFormatado = hoje.toISOString().slice(0, 10);

  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  const ontemFormatado = ontem.toISOString().slice(0, 10);

  if (data === hojeFormatado) return "Hoje";
  if (data === ontemFormatado) return "Ontem";

  return formatDate(data);
}
