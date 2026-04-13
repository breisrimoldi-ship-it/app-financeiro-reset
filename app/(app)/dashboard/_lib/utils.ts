import { getCategoryLabel } from "@/lib/finance/categories";
import { getHojeISO, getMesAtualISO } from "@/lib/finance/date";
import { formatarMoedaBRL, normalizarNumero } from "@/lib/finance/format";
import type {
  Movimentacao,
  FaturaPagamento,
  Cartao,
  ContaFixaDashboard,
  PagamentoContaDashboard,
  ResumoCartao,
  MetaResumo,
  MetasSnapshot,
  MetaPlanoRadar,
  MonthSnapshot,
  MetaRecord,
  ActionFormData,
  RecomendacaoItem,
} from "./types";

export function getMesAtual() {
  return getMesAtualISO();
}

export const getHoje = getHojeISO;

export function getInitialActionForm(): ActionFormData {
  return {
    descricao: "",
    categoria: "",
    valor: "",
    data: getHojeISO(),
    tipoPagamento: "pix_dinheiro",
    cartaoId: "",
    parcelas: "1",
    primeiraCobranca: "",
  };
}

export const formatarMoeda = formatarMoedaBRL;

export function formatarMesExtenso(anoMes: string) {
  const [ano, mes] = anoMes.split("-");
  const nomes = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  return `${nomes[Number(mes) - 1]} de ${ano}`;
}

export function adicionarMeses(anoMes: string, quantidade: number) {
  const [ano, mes] = anoMes.split("-").map(Number);
  const data = new Date(ano, mes - 1 + quantidade, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

export function getStringCampo(meta: MetaRecord, campos: string[], fallback = "") {
  for (const campo of campos) {
    const valor = meta[campo];
    if (typeof valor === "string" && valor.trim()) return valor.trim();
  }
  return fallback;
}

export function getNumeroCampo(meta: MetaRecord, campos: string[], fallback = 0) {
  for (const campo of campos) {
    const valor = meta[campo];
    if (typeof valor === "number") return valor;
    if (
      typeof valor === "string" &&
      valor.trim() !== "" &&
      !Number.isNaN(Number(valor))
    ) {
      return Number(valor);
    }
  }
  return fallback;
}

export function formatarMesCurto(anoMes: string) {
  const [ano, mes] = anoMes.split("-");
  const nomes = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  return `${nomes[Number(mes) - 1]}/${ano.slice(2)}`;
}

export function formatarCompetencia(valor: string) {
  if (!valor) return "-";
  const [ano, mes] = valor.split("-");
  if (!ano || !mes) return valor;
  return `${mes}/${ano}`;
}

export function formatarData(data: string | null | undefined) {
  if (!data) return "--/--/----";
  const [ano, mes, dia] = data.split("-");
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
}

export function formatarTipoPagamento(tipo: string | null | undefined) {
  const normalizado = (tipo ?? "").toLowerCase();
  if (normalizado === "credito") return "Cartão de Crédito";
  if (normalizado === "debito") return "Cartão de Débito";
  if (normalizado === "pix_dinheiro") return "PIX / Dinheiro";
  return "À vista";
}

export function percentualSeguro(valor: number, total: number) {
  if (total <= 0) return 0;
  return Math.min((valor / total) * 100, 100);
}

export function getCardNome(cartoes: Cartao[], cartaoId: number | null | undefined) {
  if (!cartaoId) return "Cartão";
  return cartoes.find((c) => c.id === cartaoId)?.nome ?? `Cartão ${cartaoId}`;
}

export function getCategoriaLabelSeguro(categoria: string | null | undefined) {
  if (!categoria) return "Sem categoria";
  return getCategoryLabel(categoria);
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

  if (dia > Number(cartao.fechamento_dia ?? 31)) {
    if (mes === 12) {
      anoCobranca = ano + 1;
      mesCobranca = 1;
    } else {
      mesCobranca = mes + 1;
    }
  }

  return `${anoCobranca}-${String(mesCobranca).padStart(2, "0")}`;
}

export function getUltimoMesConta(conta: ContaFixaDashboard) {
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

export function contaExisteNoMes(conta: ContaFixaDashboard, mesReferencia: string) {
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

export function contaEstaPendenteAteMes(
  conta: ContaFixaDashboard,
  mesReferencia: string,
  pagamentosContas: PagamentoContaDashboard[]
) {
  if (conta.ativa === false) return false;
  if (!conta.inicio_cobranca) return false;
  if (conta.inicio_cobranca > mesReferencia) return false;

  if (conta.tipo_recorrencia === "temporaria") {
    const ultimoMes = getUltimoMesConta(conta);
    if (ultimoMes && ultimoMes < mesReferencia) {
      // ainda pode estar pendente se algum mês anterior não foi pago
    }
  }

  const competencias: string[] = [];

  if (conta.tipo_recorrencia === "indeterminada") {
    let atual = conta.inicio_cobranca;
    while (atual <= mesReferencia) {
      competencias.push(atual);
      atual = adicionarMeses(atual, 1);
    }
  } else {
    const ultimoMes = getUltimoMesConta(conta);
    if (!ultimoMes) return false;

    let atual = conta.inicio_cobranca;
    while (atual <= mesReferencia && atual <= ultimoMes) {
      competencias.push(atual);
      atual = adicionarMeses(atual, 1);
    }
  }

  return competencias.some((competencia) => {
    const pagamento = pagamentosContas.find(
      (item) =>
        Number(item.origem_id) === conta.id &&
        item.mes_referencia === competencia &&
        (item.status ?? "").toLowerCase() === "paga"
    );

    return !pagamento;
  });
}

export function getDataVencimentoConta(
  conta: ContaFixaDashboard,
  mesReferencia: string
) {
  const dia = Math.min(Math.max(Number(conta.dia_vencimento || 1), 1), 31);
  return `${mesReferencia}-${String(dia).padStart(2, "0")}`;
}

export function getStatusContaDashboard(
  conta: ContaFixaDashboard,
  mesReferencia: string,
  pagamentosContas: PagamentoContaDashboard[]
) {
  const pagamento = pagamentosContas.find(
    (item) =>
      Number(item.origem_id) === conta.id &&
      item.mes_referencia === mesReferencia &&
      (item.status ?? "").toLowerCase() === "paga"
  );

  if (pagamento) {
    return {
      status: "paga" as const,
      dataVencimento: getDataVencimentoConta(conta, mesReferencia),
      pagamento,
    };
  }

  const hoje = getHoje();
  const mesAtual = hoje.slice(0, 7);
  const dataVencimento = getDataVencimentoConta(conta, mesReferencia);

  if (mesReferencia < mesAtual) {
    return {
      status: "vencida" as const,
      dataVencimento,
      pagamento: null,
    };
  }

  if (mesReferencia > mesAtual) {
    return {
      status: "futura" as const,
      dataVencimento,
      pagamento: null,
    };
  }

  if (dataVencimento < hoje) {
    return {
      status: "vencida" as const,
      dataVencimento,
      pagamento: null,
    };
  }

  if (dataVencimento === hoje) {
    return {
      status: "vence_hoje" as const,
      dataVencimento,
      pagamento: null,
    };
  }

  const diffDias = Math.ceil(
    (new Date(`${dataVencimento}T00:00:00`).getTime() -
      new Date(`${hoje}T00:00:00`).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (diffDias >= 1 && diffDias <= 3) {
    return {
      status: "vence_breve" as const,
      dataVencimento,
      pagamento: null,
    };
  }

  return {
    status: "aberta" as const,
    dataVencimento,
    pagamento: null,
  };
}

export function gerarSugestoesReceita({
  saldoProjetado,
  alertasContas,
  metas,
}: {
  saldoProjetado: number;
  alertasContas: {
    vencidas: Array<{ conta: ContaFixaDashboard }>;
    vencemHoje: Array<{ conta: ContaFixaDashboard }>;
    vencemBreve: Array<{ conta: ContaFixaDashboard }>;
    total: number;
  };
  metas: MetasSnapshot;
}) {
  const hoje = new Date();
  const ultimoDiaMes = new Date(
    hoje.getFullYear(),
    hoje.getMonth() + 1,
    0
  ).getDate();

  const diaAtual = hoje.getDate();
  const diasRestantes = Math.max(ultimoDiaMes - diaAtual + 1, 1);

  const totalVencidas = alertasContas.vencidas.reduce(
    (acc, item) => acc + normalizarNumero(item.conta.valor),
    0
  );

  const totalHoje = alertasContas.vencemHoje.reduce(
    (acc, item) => acc + normalizarNumero(item.conta.valor),
    0
  );

  const totalBreve = alertasContas.vencemBreve.reduce(
    (acc, item) => acc + normalizarNumero(item.conta.valor),
    0
  );

  const sugestoes: string[] = [];

  if (totalVencidas > 0) {
    sugestoes.push(
      `Hoje você precisa gerar ${formatarMoeda(
        totalVencidas
      )} para cobrir suas contas vencidas.`
    );
  }

  if (totalHoje > 0) {
    sugestoes.push(
      `Priorize pelo menos ${formatarMoeda(
        totalHoje
      )} hoje para não virar nova pendência.`
    );
  }

  if (saldoProjetado < 0) {
    const necessarioPorDia = Math.abs(saldoProjetado) / diasRestantes;

    sugestoes.push(
      `Se fizer ${formatarMoeda(
        necessarioPorDia
      )} por dia nos próximos ${diasRestantes} dia(s), você evita fechar o mês no negativo.`
    );
  }

  if (totalBreve > 0) {
    sugestoes.push(
      `Você tem ${formatarMoeda(
        totalBreve
      )} vencendo em breve. Antecipar receita agora reduz pressão nos próximos dias.`
    );
  }

  if (saldoProjetado > 0 && metas.metaMaisProxima) {
    const valorMeta = Math.min(saldoProjetado, metas.metaMaisProxima.faltante);

    sugestoes.push(
      `Depois de cobrir o urgente, você pode direcionar até ${formatarMoeda(
        valorMeta
      )} para a meta "${metas.metaMaisProxima.nome}".`
    );
  }

  if (sugestoes.length === 0) {
    sugestoes.push("Hoje sua operação está estável. Mantenha o ritmo de receita.");
  }

  return sugestoes;
}

export function calcularSaldoInicialMes(
  mesSelecionado: string,
  movimentacoes: Movimentacao[],
  faturasPagamento: FaturaPagamento[],
  cartoes: Cartao[],
  contas: ContaFixaDashboard[],
  pagamentosContas: PagamentoContaDashboard[]
) {
  const mesAnterior = adicionarMeses(mesSelecionado, -1);

  const snapMesAnterior = calcularSnapshotDoMesBase(
    mesAnterior,
    movimentacoes,
    faturasPagamento,
    cartoes,
    contas,
    pagamentosContas
  );

  return snapMesAnterior.entradas - snapMesAnterior.saidasPagas;
}

export function calcularSnapshotDoMesBase(
  mesSelecionado: string,
  movimentacoes: Movimentacao[],
  faturasPagamento: FaturaPagamento[],
  cartoes: Cartao[],
  contas: ContaFixaDashboard[],
  pagamentosContas: PagamentoContaDashboard[]
): MonthSnapshot {
  const [ano, mes] = mesSelecionado.split("-").map(Number);
  const inicioMes = `${mesSelecionado}-01`;
  const proximoMes =
    mes === 12
      ? `${ano + 1}-01-01`
      : `${ano}-${String(mes + 1).padStart(2, "0")}-01`;

  const movimentacoesMes = movimentacoes.filter((item) => {
    const data = item.data ?? "";
    return data >= inicioMes && data < proximoMes;
  });

  const entradas = movimentacoesMes.filter(
    (item) => (item.tipo ?? "").toLowerCase() === "entrada"
  );

  const despesasAvista = movimentacoesMes.filter(
    (item) =>
      (item.tipo ?? "").toLowerCase() === "despesa" &&
      (item.tipo_pagamento ?? "").toLowerCase() !== "credito"
  );

  const totalEntradas = entradas.reduce(
    (acc, item) => acc + normalizarNumero(item.valor),
    0
  );

  const totalDespesasAvista = despesasAvista.reduce(
    (acc, item) => acc + normalizarNumero(item.valor),
    0
  );

  const movimentacoesCredito = movimentacoes.filter(
    (item) =>
      (item.tipo ?? "").toLowerCase() === "despesa" &&
      (item.tipo_pagamento ?? "").toLowerCase() === "credito" &&
      !!item.cartao_id
  );

  const faturasProjetadas = new Map<string, number>();

  for (const mov of movimentacoesCredito) {
    const cartaoId = Number(mov.cartao_id);
    const valorTotal = normalizarNumero(mov.valor);
    const parcelas = Number(mov.parcelas || 1);

    let primeiraCompetencia = mov.primeira_cobranca;
    if (!primeiraCompetencia && mov.data) {
      primeiraCompetencia = mov.data.slice(0, 7);
    }

    if (!primeiraCompetencia) continue;

    const valorParcela = valorTotal / parcelas;

    for (let i = 0; i < parcelas; i++) {
      const competencia = adicionarMeses(primeiraCompetencia, i);

      if (competencia <= mesSelecionado) {
        const chave = `${cartaoId}|${competencia}`;
        const atual = faturasProjetadas.get(chave) || 0;
        faturasProjetadas.set(chave, atual + valorParcela);
      }
    }
  }

  let totalFaturasPagasNoMes = 0;
  let totalFaturasEmAbertoMes = 0;
  let totalFaturasEmAbertoAtrasadas = 0;
  let totalAdiantadasNoMes = 0;

  const resumoPorCartao = new Map<number, ResumoCartao>();

  for (const cartao of cartoes) {
    resumoPorCartao.set(cartao.id, {
      id: cartao.id,
      nome: cartao.nome,
      limite: normalizarNumero(cartao.limite),
      emAberto: 0,
    });
  }

  for (const [chave, valorFatura] of faturasProjetadas.entries()) {
    const [cartaoIdStr, competencia] = chave.split("|");
    const cartaoId = Number(cartaoIdStr);

    const pagamento = faturasPagamento.find(
      (item) =>
        item.cartao_id === cartaoId &&
        item.mes_referencia === competencia &&
        ["paga", "parcial"].includes((item.status ?? "").toLowerCase())
    );

    if (!pagamento) {
      if (competencia < mesSelecionado) {
        totalFaturasEmAbertoAtrasadas += valorFatura;
      } else if (competencia === mesSelecionado) {
        totalFaturasEmAbertoMes += valorFatura;
      }

      const resumo = resumoPorCartao.get(cartaoId);
      if (resumo) resumo.emAberto += valorFatura;
      continue;
    }

    const statusPagamento = (pagamento.status ?? "").toLowerCase();
    const valorPago = normalizarNumero(pagamento.valor_pago ?? 0);
    const mesPagamento = pagamento.data_pagamento?.slice(0, 7);

    if (statusPagamento === "parcial") {
      const valorRestante = Math.max(valorFatura - valorPago, 0);

      if (mesPagamento === mesSelecionado) {
        totalFaturasPagasNoMes += valorPago;
      }

      if (competencia < mesSelecionado) {
        totalFaturasEmAbertoAtrasadas += valorRestante;
      } else if (competencia === mesSelecionado) {
        totalFaturasEmAbertoMes += valorRestante;
      }

      const resumo = resumoPorCartao.get(cartaoId);
      if (resumo) resumo.emAberto += valorRestante;
      continue;
    }

    // status === "paga"
    if (mesPagamento === mesSelecionado) {
      const valorPagoFinal = valorPago > 0 ? valorPago : valorFatura;
      totalFaturasPagasNoMes += valorPagoFinal;

      if (competencia > mesSelecionado) {
        totalAdiantadasNoMes += valorPagoFinal;
      }
    } else {
      const resumo = resumoPorCartao.get(cartaoId);
      if (resumo && competencia <= mesSelecionado) {
        resumo.emAberto += valorFatura;
      }
    }
  }

  let totalContasPagasNoMes = 0;
  let totalContasEmAbertoMes = 0;
  let totalContasEmAbertoAtrasadas = 0;

  const contasAtivas = contas.filter((conta) => conta.ativa !== false);

  for (const conta of contasAtivas) {
    if (!conta.inicio_cobranca) continue;
    if (conta.inicio_cobranca > mesSelecionado) continue;

    const competencias: string[] = [];

    if (conta.tipo_recorrencia === "indeterminada") {
      let atual = conta.inicio_cobranca;
      while (atual <= mesSelecionado) {
        competencias.push(atual);
        atual = adicionarMeses(atual, 1);
      }
    } else {
      const ultimoMes = getUltimoMesConta(conta);
      if (!ultimoMes) continue;

      let atual = conta.inicio_cobranca;
      while (atual <= mesSelecionado && atual <= ultimoMes) {
        competencias.push(atual);
        atual = adicionarMeses(atual, 1);
      }
    }

    for (const competencia of competencias) {
      const pagamento = pagamentosContas.find(
        (item) =>
          Number(item.origem_id) === conta.id &&
          item.mes_referencia === competencia &&
          (item.status ?? "").toLowerCase() === "paga"
      );

      const valorConta = normalizarNumero(conta.valor);

      if (!pagamento) {
        if (competencia < mesSelecionado) {
          totalContasEmAbertoAtrasadas += valorConta;
        } else if (competencia === mesSelecionado) {
          totalContasEmAbertoMes += valorConta;
        }
        continue;
      }

      const mesPagamento = pagamento.data_pagamento?.slice(0, 7);

      if (mesPagamento === mesSelecionado) {
        totalContasPagasNoMes += normalizarNumero(
          pagamento.valor_pago || valorConta
        );
      }
    }
  }

  const totalSaidasPagas =
    totalDespesasAvista + totalFaturasPagasNoMes + totalContasPagasNoMes;

  const comprometidoMes =
    totalFaturasEmAbertoMes + totalContasEmAbertoMes;

  const comprometidoAtrasado =
    totalFaturasEmAbertoAtrasadas + totalContasEmAbertoAtrasadas;

  const totalComprometido = comprometidoMes + comprometidoAtrasado;

  return {
    saldoInicial: 0,
    entradas: totalEntradas,
    saidasPagas: totalSaidasPagas,
    comprometidoMes,
    comprometidoAtrasado,
    comprometido: totalComprometido,
    saldoDisponivel: totalEntradas - totalSaidasPagas,
    adiantadas: totalAdiantadasNoMes,
    cartoesResumo: Array.from(resumoPorCartao.values()),
  };
}

export function calcularSnapshotDoMes(
  mesSelecionado: string,
  movimentacoes: Movimentacao[],
  faturasPagamento: FaturaPagamento[],
  cartoes: Cartao[],
  contas: ContaFixaDashboard[],
  pagamentosContas: PagamentoContaDashboard[]
): MonthSnapshot {
  const base = calcularSnapshotDoMesBase(
    mesSelecionado,
    movimentacoes,
    faturasPagamento,
    cartoes,
    contas,
    pagamentosContas
  );

  const saldoInicial = calcularSaldoInicialMes(
    mesSelecionado,
    movimentacoes,
    faturasPagamento,
    cartoes,
    contas,
    pagamentosContas
  );

  const saldoDisponivel = saldoInicial + base.entradas - base.saidasPagas;

  return {
    ...base,
    saldoInicial,
    saldoDisponivel,
  };
}

export function formatarPrazoCurto(data: string | null) {
  if (!data) return "Sem prazo";
  if (/^\d{4}-\d{2}$/.test(data)) return formatarCompetencia(data);
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return formatarData(data);
  return data;
}

export function getDataPrazoMeta(prazo: string | null) {
  if (!prazo) return null;

  if (/^\d{4}-\d{2}$/.test(prazo)) {
    const [ano, mes] = prazo.split("-").map(Number);
    return new Date(ano, mes, 0);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(prazo)) {
    return new Date(`${prazo}T23:59:59`);
  }

  return null;
}

export function calcularPlanoMeta(meta: MetaResumo, saldoDisponivel: number, prioridade: number): MetaPlanoRadar | null {
  if (!meta.id || meta.faltante <= 0) return null;

  const dataPrazo = getDataPrazoMeta(meta.prazo);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diasAtePrazo = dataPrazo
    ? Math.max(
        Math.ceil((dataPrazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)),
        1
      )
    : 30;

  const valorPorDia = meta.faltante / diasAtePrazo;
  const multiplicadorPrioridade = prioridade === 1 ? 1.25 : prioridade === 2 ? 1 : 0.85;
  const valorSugeridoHoje = saldoDisponivel > 0
    ? Math.min(meta.faltante, Math.max(valorPorDia * multiplicadorPrioridade, valorPorDia))
    : 0;

  return {
    id: meta.id,
    nome: meta.nome,
    prazo: meta.prazo,
    faltante: meta.faltante,
    valorPorDia,
    valorSugeridoHoje,
    percentual: meta.percentual,
    prioridade,
  };
}

export function gerarInsights({
  entradas,
  saidas,
  comprometido,
  saldo,
  metas,
}: {
  entradas: number;
  saidas: number;
  comprometido: number;
  saldo: number;
  metas: MetasSnapshot;
}) {
  const insights: {
    tipo: "alerta" | "positivo" | "neutro";
    texto: string;
  }[] = [];

  const usoTotal = saidas + comprometido;

  if (usoTotal > entradas) {
    insights.push({
      tipo: "alerta",
      texto: `Você já comprometeu mais do que ganhou este mês.`,
    });
  }

  if (saldo > 0 && metas.metaMaisProxima) {
    insights.push({
      tipo: "positivo",
      texto: `Você pode aportar até ${formatarMoeda(
        saldo
      )} na meta "${metas.metaMaisProxima.nome}".`,
    });
  }

  if (saidas === 0 && comprometido > 0) {
    insights.push({
      tipo: "neutro",
      texto: `Você ainda não teve saídas reais, mas já possui valores comprometidos.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      tipo: "neutro",
      texto: `Seu mês está equilibrado até agora.`,
    });
  }

  return insights;
}

export function gerarPrevisao({
  entradas,
  saidas,
  comprometido,
}: {
  entradas: number;
  saidas: number;
  comprometido: number;
}) {
  const hoje = new Date();
  const diaAtual = hoje.getDate();

  const ultimoDiaMes = new Date(
    hoje.getFullYear(),
    hoje.getMonth() + 1,
    0
  ).getDate();

  const diasRestantes = Math.max(ultimoDiaMes - diaAtual + 1, 1);

  const gastoDiarioAtual = diaAtual > 0 ? saidas / diaAtual : 0;

  // projeção conservadora: o que ainda falta pagar + ritmo atual de gasto real
  const previsaoSaidasReaisRestantes = gastoDiarioAtual * diasRestantes;
  const saldoFinalPrevisto =
    entradas - saidas - comprometido - previsaoSaidasReaisRestantes;

  const gastoDiarioPermitido =
    diasRestantes > 0
      ? (entradas - saidas - comprometido) / diasRestantes
      : 0;

  return {
    saldoFinalPrevisto,
    gastoDiarioAtual,
    gastoDiarioPermitido,
    diasRestantes,
  };
}

export function calcularValorAtualMetaDashboard(
  meta: Record<string, unknown>,
  aportes: Record<string, unknown>[]
) {
  const valorInicial = getNumeroCampo(meta, ["valor_inicial"], 0);
  const valorAtualBase = getNumeroCampo(
    meta,
    ["valor_atual", "valor_guardado", "guardado", "saved_amount", "valor"],
    0
  );

  const base = valorAtualBase > 0 ? valorAtualBase : valorInicial;

  const totalHistorico = aportes.reduce((acc, item) => {
    const valor = getNumeroCampo(item, ["valor"], 0);
    const tipo = getStringCampo(item, ["tipo"], "").toLowerCase();

    if (tipo === "aporte") return acc + valor;
    if (tipo === "retirada") return acc - valor;
    if (tipo === "ajuste") return acc + valor;

    return acc;
  }, 0);

  return base + totalHistorico;
}

export function calcularMetasSnapshotComAportes(
  metasRaw: Record<string, unknown>[],
  aportesRaw: Record<string, unknown>[]
): MetasSnapshot {
  const metas = metasRaw
    .filter((meta) => {
      const status = getStringCampo(meta, ["status"], "ativa").toLowerCase();
      const considerar =
        typeof meta.considerar_na_dashboard === "boolean"
          ? meta.considerar_na_dashboard
          : true;

      return status === "ativa" && considerar;
    })
    .map((meta, index) => {
      const metaId = getStringCampo(meta, ["id"], "");
      const aportesDaMeta = aportesRaw.filter(
        (item) => getStringCampo(item, ["meta_id"], "") === metaId
      );

      const nome =
        getStringCampo(meta, ["nome", "titulo", "descricao"], `Meta ${index + 1}`) ||
        `Meta ${index + 1}`;

      const valorMeta = Math.max(
        getNumeroCampo(meta, [
          "valor_meta",
          "valor_alvo",
          "meta",
          "objetivo",
          "target_amount",
        ]),
        0
      );

      const valorAtual = Math.max(
        calcularValorAtualMetaDashboard(meta, aportesDaMeta),
        0
      );

      const prazo =
        getStringCampo(meta, ["prazo", "data_limite", "deadline"], "") || null;

      const faltante = Math.max(valorMeta - valorAtual, 0);
      const percentual =
        valorMeta > 0 ? Math.min((valorAtual / valorMeta) * 100, 100) : 0;

      return {
        id: metaId,
        nome,
        valorMeta,
        valorAtual,
        faltante,
        percentual,
        prazo,
      };
    })
    .filter((meta) => meta.valorMeta > 0 || meta.valorAtual > 0);

  const totalGuardado = metas.reduce((acc, meta) => acc + meta.valorAtual, 0);

  const metasOrdenadas = [...metas]
    .filter((meta) => meta.faltante > 0)
    .sort((a, b) => {
      const aTemPrazo = Boolean(a.prazo);
      const bTemPrazo = Boolean(b.prazo);

      if (aTemPrazo && !bTemPrazo) return -1;
      if (!aTemPrazo && bTemPrazo) return 1;

      if (a.prazo && b.prazo && a.prazo !== b.prazo) {
        return a.prazo.localeCompare(b.prazo);
      }

      return a.faltante - b.faltante;
    });

  return {
    totalGuardado,
    quantidadeAtivas: metas.length,
    metaMaisProxima: metasOrdenadas[0] ?? null,
    metasOrdenadas,
  };
}

export function gerarRecomendacoes({
  saldo,
  previsao,
  metas,
}: {
  saldo: number;
  previsao: ReturnType<typeof gerarPrevisao>;
  metas: MetasSnapshot;
}): RecomendacaoItem[] {
  const recomendacoes: RecomendacaoItem[] = [];

  if (previsao.saldoFinalPrevisto < 0) {
    const deficit = Math.abs(previsao.saldoFinalPrevisto);

    recomendacoes.push({
      tipo: "alerta",
      texto: `Você precisa reduzir cerca de ${formatarMoeda(
        deficit / (previsao.diasRestantes || 1)
      )} por dia para não fechar o mês negativo.`,
    });
  }

  if (saldo > 0 && metas.metaMaisProxima?.id) {
    const valorSugerido = Number((saldo * 0.5).toFixed(2));

    recomendacoes.push({
      tipo: "acao",
      texto: `Você pode guardar ${formatarMoeda(
        valorSugerido
      )} hoje na meta "${metas.metaMaisProxima.nome}".`,
      acao: {
        tipo: "guardar_meta",
        valor: valorSugerido,
        metaId: metas.metaMaisProxima.id,
        metaNome: metas.metaMaisProxima.nome,
      },
    });
  }

  if (saldo > 0 && previsao.saldoFinalPrevisto > 0) {
    recomendacoes.push({
      tipo: "acao",
      texto: `Você está em um bom ritmo. Continue mantendo seus gastos controlados.`,
    });
  }

  if (recomendacoes.length === 0) {
    recomendacoes.push({
      tipo: "acao",
      texto: `Sem ações necessárias agora.`,
    });
  }

  return recomendacoes;
}
