import { getHojeISO } from "@/lib/finance/date";
import { formatarMoedaBRL, normalizarNumero } from "@/lib/finance/format";
import type {
  MetaRow,
  MetaAporteRow,
  MetaFormState,
  AporteFormState,
  MetaStatus,
} from "./types";

export const getHoje = getHojeISO;
export const formatarMoeda = formatarMoedaBRL;

export function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function diferencaMesesEntreDatas(inicio: Date, fim: Date) {
  const anos = fim.getFullYear() - inicio.getFullYear();
  const meses = fim.getMonth() - inicio.getMonth();
  const total = anos * 12 + meses;

  return total < 0 ? 0 : total;
}

export function somarAportesValidos(aportes: MetaAporteRow[]) {
  return aportes.reduce((acc, item) => {
    const valor = normalizarNumero(item.valor);

    if (item.tipo === "aporte") return acc + valor;
    if (item.tipo === "retirada") return acc - valor;
    if (item.tipo === "ajuste") return acc + valor;

    return acc;
  }, 0);
}

export function getMediaMensalAportes(aportes: MetaAporteRow[]) {
  if (!aportes.length) return 0;

  const total = somarAportesValidos(aportes);

  const datasValidas = aportes
    .map((item) => item.data)
    .filter(Boolean)
    .sort();

  if (!datasValidas.length) return total;

  const primeiraData = new Date(`${datasValidas[0]}T12:00:00`);
  const hoje = new Date();
  const meses = Math.max(diferencaMesesEntreDatas(primeiraData, hoje) + 1, 1);

  return total / meses;
}

export function getPrevisaoConclusaoTexto(
  faltante: number,
  mediaMensalAportes: number,
  percentual: number
) {
  if (faltante <= 0 || percentual >= 100) return "Meta já concluída";

  if (mediaMensalAportes <= 0) {
    return "Sem histórico suficiente para prever";
  }

  const meses = Math.ceil(faltante / mediaMensalAportes);

  if (meses <= 1) return "Previsão de conclusão em até 1 mês";
  return `Previsão de conclusão em cerca de ${meses} meses`;
}

export function formatarData(data: string | null | undefined) {
  if (!data) return "Sem prazo";
  const [ano, mes, dia] = data.split("-");
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
}

export function getStatusLabel(status: MetaStatus) {
  switch (status) {
    case "ativa":
      return "Ativa";
    case "pausada":
      return "Pausada";
    case "concluida":
      return "Concluída";
    case "cancelada":
      return "Cancelada";
    default:
      return status;
  }
}

export function getPrioridadeLabel(prioridade: number) {
  if (prioridade === 1) return "Alta";
  if (prioridade === 2) return "Média";
  return "Baixa";
}

export function getPercentual(valorAtual: number, valorMeta: number) {
  if (valorMeta <= 0) return 0;
  return Math.max(0, Math.min((valorAtual / valorMeta) * 100, 100));
}

export function getMetaFormInicial(): MetaFormState {
  return {
    nome: "",
    descricao: "",
    tipo: "",
    valorMeta: "",
    valorInicial: "0",
    prazo: "",
    prioridade: 2,
    status: "ativa",
    considerarNaDashboard: true,
  };
}

export function getAporteFormInicial(): AporteFormState {
  return {
    tipo: "aporte",
    valor: "",
    descricao: "",
    data: getHoje(),
  };
}

export function calcularValorAtual(meta: MetaRow, aportes: MetaAporteRow[]) {
  const valorInicial = normalizarNumero(meta.valor_inicial);
  const valorAtualBase = normalizarNumero(meta.valor_atual);

  const base = valorAtualBase > 0 ? valorAtualBase : valorInicial;

  const totalHistorico = aportes.reduce((acc, item) => {
    const valor = normalizarNumero(item.valor);

    if (item.tipo === "aporte") return acc + valor;
    if (item.tipo === "retirada") return acc - valor;
    if (item.tipo === "ajuste") return acc + valor;

    return acc;
  }, 0);

  return base + totalHistorico;
}
