import { getHojeISO, getMesAtualISO } from "@/lib/finance/date";
import { formatarMoedaBRL } from "@/lib/finance/format";
import type { ContaFixa, PagamentoConta } from "./types";

export function getMesAtual() {
  return getMesAtualISO();
}

export function getDataHoje() {
  return getHojeISO();
}

export const formatarMoeda = formatarMoedaBRL;

export function formatarMesAno(anoMes: string | null) {
  if (!anoMes) return "-";

  const [ano, mes] = anoMes.split("-");
  const nomes = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  return `${nomes[Number(mes) - 1]} ${ano}`;
}

export function formatarData(data: string | null) {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function adicionarMeses(anoMes: string, quantidade: number) {
  const [ano, mes] = anoMes.split("-").map(Number);
  const data = new Date(ano, mes - 1 + quantidade, 1);

  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

export function diferencaMeses(inicio: string, fim: string) {
  const [anoInicio, mesInicio] = inicio.split("-").map(Number);
  const [anoFim, mesFim] = fim.split("-").map(Number);

  return (anoFim - anoInicio) * 12 + (mesFim - mesInicio);
}

export function getUltimoMesConta(conta: ContaFixa) {
  if (!conta.inicio_cobranca) return null;

  if (conta.tipo_recorrencia === "indeterminada") {
    return null;
  }

  if (conta.fim_cobranca) {
    return conta.fim_cobranca;
  }

  if (conta.quantidade_meses && conta.quantidade_meses > 0) {
    return adicionarMeses(conta.inicio_cobranca, conta.quantidade_meses - 1);
  }

  return null;
}

export function contaExisteNoMes(conta: ContaFixa, mesReferencia: string) {
  if (!conta.inicio_cobranca) return false;

  if (conta.inicio_cobranca > mesReferencia) {
    return false;
  }

  if (conta.tipo_recorrencia === "indeterminada") {
    return true;
  }

  const ultimoMes = getUltimoMesConta(conta);

  if (!ultimoMes) return false;

  return mesReferencia >= conta.inicio_cobranca && mesReferencia <= ultimoMes;
}

export function contaAtivaNoMes(conta: ContaFixa, mesReferencia: string) {
  return conta.ativa && contaExisteNoMes(conta, mesReferencia);
}

export function getMesesRestantes(conta: ContaFixa, mesReferencia: string) {
  if (!conta.ativa) return 0;
  if (conta.tipo_recorrencia !== "temporaria") return 0;
  if (!conta.inicio_cobranca) return 0;

  const ultimoMes = getUltimoMesConta(conta);
  if (!ultimoMes) return 0;

  if (mesReferencia > ultimoMes) {
    return 0;
  }

  const mesInicialConsiderado =
    mesReferencia < conta.inicio_cobranca ? conta.inicio_cobranca : mesReferencia;

  return diferencaMeses(mesInicialConsiderado, ultimoMes) + 1;
}

export function pagamentoEhAdiantado(
  pagamento: PagamentoConta | undefined,
  mesReferencia: string
) {
  if (!pagamento?.data_pagamento) return false;
  const mesPagamento = pagamento.data_pagamento.slice(0, 7);
  return mesPagamento < mesReferencia;
}

export function normalizarCategoria(valor: string) {
  const texto = valor.replace(/\s+/g, " ").trim().toLowerCase();
  if (!texto) return "";

  return texto
    .split(" ")
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

export function ordenarPorVencimento(a: ContaFixa, b: ContaFixa) {
  if (a.ativa !== b.ativa) return a.ativa ? -1 : 1;
  if (a.dia_vencimento !== b.dia_vencimento) {
    return a.dia_vencimento - b.dia_vencimento;
  }
  return a.descricao.localeCompare(b.descricao);
}

export function cls(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
