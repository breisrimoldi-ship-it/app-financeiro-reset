import type { CustoDia, DiaDetalhado, InsumoSelecionado, CustoManualItem } from "./types";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function getHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function getDatesInRange(start: string, end: string) {
  if (!start || !end) return [];

  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return [];
  }

  if (startDate > endDate) return [];

  const dates: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function distributeAmount(total: number, count: number) {
  if (count <= 0) return [];
  const totalCents = Math.round(total * 100);
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;

  return Array.from({ length: count }, (_, index) => {
    const cents = base + (index === count - 1 ? remainder : 0);
    return cents / 100;
  });
}

export function createEmptyCost(): CustoDia {
  return {
    id: crypto.randomUUID(),
    categoriaId: "",
    descricao: "",
    valor: "",
  };
}

export function createDay(date: string, descricaoBase: string): DiaDetalhado {
  return {
    data: date,
    ativo: true,
    descricao: descricaoBase,
    valorRecebido: "",
    horas: "",
    quantidade: "",
    observacao: "",
    custos: [],
  };
}

export function createEmptyInsumoSelecionado(): InsumoSelecionado {
  return {
    id: crypto.randomUUID(),
    insumoId: "",
    quantidade: "",
    valorUnitario: "",
  };
}

export function createEmptyCustoManual(): CustoManualItem {
  return {
    id: crypto.randomUUID(),
    categoriaId: "",
    descricao: "",
    valor: "",
  };
}

export function parseHorasToDecimal(valor: string) {
  const texto = valor.trim().toLowerCase();

  if (!texto) return 0;

  let match = texto.match(/^(\d{1,2})h(\d{1,2})min$/);
  if (match) {
    const horas = Number(match[1]) || 0;
    const minutos = Number(match[2]) || 0;
    return horas + minutos / 60;
  }

  match = texto.match(/^(\d{1,2}):(\d{1,2})$/);
  if (match) {
    const horas = Number(match[1]) || 0;
    const minutos = Number(match[2]) || 0;
    return horas + minutos / 60;
  }

  match = texto.match(/^(\d{1,2})h(\d{1,2})$/);
  if (match) {
    const horas = Number(match[1]) || 0;
    const minutos = Number(match[2]) || 0;
    return horas + minutos / 60;
  }

  match = texto.match(/^(\d{1,2})h$/);
  if (match) {
    const horas = Number(match[1]) || 0;
    return horas;
  }

  match = texto.match(/^(\d{1,2})$/);
  if (match) {
    const horas = Number(match[1]) || 0;
    return horas;
  }

  return 0;
}

export function normalizarHorasInput(valor: string) {
  const texto = valor.replace(/\s/g, "").toLowerCase();

  if (!texto) return "";

  let match = texto.match(/^(\d{1,2})h(\d{1,2})min$/);
  if (match) {
    const horas = String(Math.min(Number(match[1]) || 0, 23)).padStart(2, "0");
    const minutos = String(Math.min(Number(match[2]) || 0, 59)).padStart(
      2,
      "0"
    );
    return `${horas}h${minutos}min`;
  }

  match = texto.match(/^(\d{1,2}):(\d{1,2})$/);
  if (match) {
    const horas = String(Math.min(Number(match[1]) || 0, 23)).padStart(2, "0");
    const minutos = String(Math.min(Number(match[2]) || 0, 59)).padStart(
      2,
      "0"
    );
    return `${horas}h${minutos}min`;
  }

  match = texto.match(/^(\d{1,2})h(\d{1,2})$/);
  if (match) {
    const horas = String(Math.min(Number(match[1]) || 0, 23)).padStart(2, "0");
    const minutos = String(Math.min(Number(match[2]) || 0, 59)).padStart(
      2,
      "0"
    );
    return `${horas}h${minutos}min`;
  }

  match = texto.match(/^(\d{1,2})h$/);
  if (match) {
    const horas = String(Math.min(Number(match[1]) || 0, 23)).padStart(2, "0");
    return `${horas}h00min`;
  }

  match = texto.match(/^(\d{1,2})$/);
  if (match) {
    const horas = String(Math.min(Number(match[1]) || 0, 23)).padStart(2, "0");
    return `${horas}h00min`;
  }

  return valor;
}
