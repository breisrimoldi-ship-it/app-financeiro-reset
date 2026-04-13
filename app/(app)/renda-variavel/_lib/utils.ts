export function formatMoney(value: number) {
  return value.toFixed(2);
}

export function formatDate(value: string) {
  if (!value) return "—";

  const [ano, mes, dia] = value.split("-");
  if (!ano || !mes || !dia) return value;

  return `${dia}/${mes}/${ano}`;
}

export function stripTipoPrefix(descricao: string) {
  if (!descricao) return "";
  return descricao.replace(/^\[(.+?)\]\s*/, "").trim();
}

export function getMesAtual() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
}

export function getRangeFromMes(mes: string) {
  const [ano, mesNumero] = mes.split("-").map(Number);

  const inicio = new Date(ano, mesNumero - 1, 1);
  const fim = new Date(ano, mesNumero, 0);

  return {
    inicioStr: inicio.toISOString().slice(0, 10),
    fimStr: fim.toISOString().slice(0, 10),
  };
}

export function formatCompetenciaLabel(mes: string) {
  const [ano, mesNumero] = mes.split("-");
  if (!ano || !mesNumero) return mes;
  return `${mesNumero}/${ano}`;
}

export function getMesAnterior(mes: string) {
  const [ano, mesNumero] = mes.split("-").map(Number);

  if (!ano || !mesNumero) return getMesAtual();

  const referencia = new Date(ano, mesNumero - 1, 1);
  referencia.setMonth(referencia.getMonth() - 1);

  return `${referencia.getFullYear()}-${String(referencia.getMonth() + 1).padStart(2, "0")}`;
}

export function formatDelta(valorAtual: number, valorAnterior: number) {
  const diferenca = valorAtual - valorAnterior;
  const base = Math.abs(valorAnterior);
  const percentual = base > 0 ? (diferenca / base) * 100 : null;

  return {
    diferenca,
    percentual,
    isPositivo: diferenca >= 0,
  };
}

export function getUltimosMeses(referencia: string, quantidade: number) {
  const [ano, mes] = referencia.split("-").map(Number);
  const base = new Date(ano, mes - 1, 1);
  const meses: string[] = [];

  for (let i = quantidade - 1; i >= 0; i -= 1) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  return meses;
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

export function getRangeFromMeses(meses: string[]) {
  const primeiro = meses[0];
  const ultimo = meses[meses.length - 1];
  const inicio = `${primeiro}-01`;

  const [anoFim, mesFim] = ultimo.split("-").map(Number);
  const ultimoDia = new Date(anoFim, mesFim, 0).getDate();
  const fim = `${ultimo}-${String(ultimoDia).padStart(2, "0")}`;

  return { inicio, fim };
}
