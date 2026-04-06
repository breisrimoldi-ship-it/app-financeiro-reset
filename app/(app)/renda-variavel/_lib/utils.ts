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

export function getRangeFromMeses(meses: string[]) {
  const primeiro = meses[0];
  const ultimo = meses[meses.length - 1];
  const inicio = `${primeiro}-01`;

  const [anoFim, mesFim] = ultimo.split("-").map(Number);
  const ultimoDia = new Date(anoFim, mesFim, 0).getDate();
  const fim = `${ultimo}-${String(ultimoDia).padStart(2, "0")}`;

  return { inicio, fim };
}
