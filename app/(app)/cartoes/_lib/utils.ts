export function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function getMesAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

export function adicionarMeses(mesBase: string, quantidade: number) {
  const [ano, mes] = mesBase.split("-").map(Number);
  const data = new Date(ano, mes - 1 + quantidade, 1);
  const novoAno = data.getFullYear();
  const novoMes = String(data.getMonth() + 1).padStart(2, "0");
  return `${novoAno}-${novoMes}`;
}

export function formatarMes(mesAno: string) {
  const [ano, mes] = mesAno.split("-");
  const nomes = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return `${nomes[Number(mes) - 1]} de ${ano}`;
}

export function formatarVencimento(mesAno: string, vencimentoDia: number) {
  const [ano, mes] = mesAno.split("-");
  const dia = String(vencimentoDia).padStart(2, "0");
  return `${dia}/${mes}/${ano}`;
}

export function getDataHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function getProximaCompetencia(vencimentoDia: number) {
  const hoje = new Date();
  const diaAtual = hoje.getDate();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  const dataCompetencia =
    diaAtual > vencimentoDia
      ? new Date(ano, mes + 1, 1)
      : new Date(ano, mes, 1);

  const competenciaAno = dataCompetencia.getFullYear();
  const competenciaMes = String(dataCompetencia.getMonth() + 1).padStart(2, "0");

  return `${competenciaAno}-${competenciaMes}`;
}

export function obterStatusFatura({
  total,
  valorPago,
  statusBanco,
}: {
  total: number;
  valorPago: number;
  statusBanco?: string | null;
}) {
  if (valorPago >= total && total > 0) return "paga";
  if (valorPago > 0 && valorPago < total) return "parcial";

  if (statusBanco === "paga") return "paga";
  if (statusBanco === "parcial") return "parcial";

  return "aberta";
}

export function formatarDataPadraoBrasil(data: string) {
  if (!data) return "";

  const partes = data.split("-");
  if (partes.length !== 3) return data;

  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}
