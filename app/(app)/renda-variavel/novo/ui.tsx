"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { TIPO_RV_LABEL, type TipoRvLancamento } from "../_lib/tipos";
import Link from "next/link";
import {
  ArrowLeft,
  Calculator,
  CalendarRange,
  Clock3,
  Package,
  Plus,
  Receipt,
  Save,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { criarLancamentosRendaVariavel } from "./actions";

type CategoriaCusto = {
  id: string;
  nome: string;
  ativo: boolean;
  descricao_padrao: string | null;
  valor_padrao: number | null;
  usar_valor_padrao: boolean;
};

type Perfil = {
  id: string;
  nome: string;
};

type Insumo = {
  id: string;
  nome: string;
  unidade: string;
  valor_base: number | null;
  categoria_id: string | null;
  ativo: boolean | null;
};

type TipoLancamento = "unico" | "intervalo";
type ModoIntervalo = "resumo" | "dia-a-dia";

type CustoDia = {
  id: string;
  categoriaId: string;
  descricao: string;
  valor: string;
};

type DiaDetalhado = {
  data: string;
  ativo: boolean;
  descricao: string;
  valorRecebido: string;
  horas: string;
  quantidade: string;
  observacao: string;
  custos: CustoDia[];
};

type InsumoSelecionado = {
  id: string;
  insumoId: string;
  quantidade: string;
  valorUnitario: string;
};

type CustoManualItem = {
  id: string;
  categoriaId: string;
  descricao: string;
  valor: string;
};

const perfisMock: Perfil[] = [
  { id: "1", nome: "Motorista" },
  { id: "2", nome: "Confeitaria" },
  { id: "3", nome: "Freelancer" },
  { id: "4", nome: "Personalizado" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function getDatesInRange(start: string, end: string) {
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

function distributeAmount(total: number, count: number) {
  if (count <= 0) return [];
  const totalCents = Math.round(total * 100);
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;

  return Array.from({ length: count }, (_, index) => {
    const cents = base + (index === count - 1 ? remainder : 0);
    return cents / 100;
  });
}

function createEmptyCost(): CustoDia {
  return {
    id: crypto.randomUUID(),
    categoriaId: "",
    descricao: "",
    valor: "",
  };
}

function createDay(date: string, descricaoBase: string): DiaDetalhado {
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

function createEmptyInsumoSelecionado(): InsumoSelecionado {
  return {
    id: crypto.randomUUID(),
    insumoId: "",
    quantidade: "",
    valorUnitario: "",
  };
}

function createEmptyCustoManual(): CustoManualItem {
  return {
    id: crypto.randomUUID(),
    categoriaId: "",
    descricao: "",
    valor: "",
  };
}

function parseHorasToDecimal(valor: string) {
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

function normalizarHorasInput(valor: string) {
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

type Props = {
  categorias: CategoriaCusto[];
  insumos: Insumo[];
};

export default function NovoLancamentoClient({
  categorias,
  insumos,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const [tipoLancamento, setTipoLancamento] =
    useState<TipoLancamento>("unico");
  const [modoIntervalo, setModoIntervalo] = useState<ModoIntervalo>("resumo");
  const [tipoRv, setTipoRv] = useState<TipoRvLancamento>("receita_bruta");

  const [data, setData] = useState(getHoje());
  const [dataInicio, setDataInicio] = useState(getHoje());
  const [dataFim, setDataFim] = useState(getHoje());

  const [descricao, setDescricao] = useState("");
  const [perfilId, setPerfilId] = useState(perfisMock[0]?.id ?? "");
  const [valorRecebido, setValorRecebido] = useState("");
  const [cliente, setCliente] = useState("");
  const [horasTrabalhadas, setHorasTrabalhadas] = useState("");
  const [quantidade, setQuantidade] = useState("");

  const [erro, setErro] = useState("");

  const [insumosSelecionados, setInsumosSelecionados] = useState<
    InsumoSelecionado[]
  >([]);

  const [custosManuais, setCustosManuais] = useState<CustoManualItem[]>([]);

  const [diasDetalhados, setDiasDetalhados] = useState<DiaDetalhado[]>([]);

  const datasDoIntervalo = useMemo(() => {
    if (tipoLancamento !== "intervalo") return [];
    return getDatesInRange(dataInicio, dataFim);
  }, [tipoLancamento, dataInicio, dataFim]);

  const diasNoIntervalo = datasDoIntervalo.length;

  useEffect(() => {
    if (tipoLancamento !== "intervalo" || modoIntervalo !== "dia-a-dia") {
      return;
    }

    setDiasDetalhados((prev) =>
      datasDoIntervalo.map((date) => {
        const existente = prev.find((dia) => dia.data === date);
        if (existente) return existente;
        return createDay(date, descricao);
      })
    );
  }, [tipoLancamento, modoIntervalo, datasDoIntervalo, descricao]);

  const valorRecebidoNumero = Number(valorRecebido) || 0;
  const horasTrabalhadasNumero = parseHorasToDecimal(horasTrabalhadas);
  const quantidadeNumero = Number(quantidade) || 0;

  const itensCalculados = useMemo(() => {
    return insumosSelecionados
      .map((itemSelecionado) => {
        const insumo = insumos.find((item) => item.id === itemSelecionado.insumoId);

        if (!insumo) return null;

        const quantidadeDigitada = Number(itemSelecionado.quantidade || 0);
        const valorBase = Number(itemSelecionado.valorUnitario || 0);
        const total = quantidadeDigitada * valorBase;

        return {
          id: insumo.id,
          nome: insumo.nome,
          unidade: insumo.unidade,
          categoria_id: insumo.categoria_id,
          valorBase,
          quantidade: quantidadeDigitada,
          total,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      nome: string;
      unidade: string;
      categoria_id: string | null;
      valorBase: number;
      quantidade: number;
      total: number;
    }>;
  }, [insumosSelecionados, insumos]);

  const custoInsumos = useMemo(() => {
    return itensCalculados.reduce((acc, item) => acc + item.total, 0);
  }, [itensCalculados]);

  const custosManuaisValidos = useMemo(() => {
    return custosManuais
      .map((custo) => {
        const categoria = categorias.find(
          (categoriaItem) => categoriaItem.id === custo.categoriaId
        );

        return {
          categoriaId: categoria?.id ?? null,
          categoriaNome: categoria?.nome ?? "",
          descricao: custo.descricao.trim(),
          valor: Number(custo.valor) || 0,
        };
      })
      .filter(
        (custo) => custo.categoriaNome && custo.descricao && custo.valor > 0
      );
  }, [custosManuais, categorias]);

  const custoManualNumero = useMemo(() => {
    return custosManuaisValidos.reduce((acc, item) => acc + item.valor, 0);
  }, [custosManuaisValidos]);

  const custoTotal = custoInsumos + custoManualNumero;
  const lucroLiquido = valorRecebidoNumero - custoTotal;
  const lucroPorHora =
    horasTrabalhadasNumero > 0 ? lucroLiquido / horasTrabalhadasNumero : 0;
  const margem =
    valorRecebidoNumero > 0 ? (lucroLiquido / valorRecebidoNumero) * 100 : 0;

  const previewPorDia = useMemo(() => {
    if (
      tipoLancamento !== "intervalo" ||
      modoIntervalo !== "resumo" ||
      diasNoIntervalo <= 0
    ) {
      return null;
    }

    return {
      recebido: valorRecebidoNumero / diasNoIntervalo,
      horas: horasTrabalhadasNumero / diasNoIntervalo,
      quantidade: quantidadeNumero / diasNoIntervalo,
      custoManual: custoManualNumero / diasNoIntervalo,
      custoInsumos: custoInsumos / diasNoIntervalo,
      custoTotal: custoTotal / diasNoIntervalo,
      lucro: lucroLiquido / diasNoIntervalo,
    };
  }, [
    tipoLancamento,
    modoIntervalo,
    diasNoIntervalo,
    valorRecebidoNumero,
    horasTrabalhadasNumero,
    quantidadeNumero,
    custoManualNumero,
    custoInsumos,
    custoTotal,
    lucroLiquido,
  ]);

  const diasAtivosDetalhados = useMemo(
    () => diasDetalhados.filter((dia) => dia.ativo),
    [diasDetalhados]
  );

  const resumoDiaADia = useMemo(() => {
    if (tipoLancamento !== "intervalo" || modoIntervalo !== "dia-a-dia") {
      return null;
    }

    const totalRecebido = diasAtivosDetalhados.reduce(
      (acc, dia) => acc + (Number(dia.valorRecebido) || 0),
      0
    );

    const totalHoras = diasAtivosDetalhados.reduce(
      (acc, dia) => acc + parseHorasToDecimal(dia.horas),
      0
    );

    const totalQuantidade = diasAtivosDetalhados.reduce(
      (acc, dia) => acc + (Number(dia.quantidade) || 0),
      0
    );

    const totalCustos = diasAtivosDetalhados.reduce((acc, dia) => {
      const totalDia = dia.custos.reduce(
        (soma, custo) => soma + (Number(custo.valor) || 0),
        0
      );
      return acc + totalDia;
    }, 0);

    const lucroTotal = totalRecebido - totalCustos;
    const lucroHoraMedio = totalHoras > 0 ? lucroTotal / totalHoras : 0;
    const margemMedia =
      totalRecebido > 0 ? (lucroTotal / totalRecebido) * 100 : 0;

    return {
      totalRecebido,
      totalHoras,
      totalQuantidade,
      totalCustos,
      lucroTotal,
      lucroHoraMedio,
      margemMedia,
      mediaPorDia:
        diasAtivosDetalhados.length > 0
          ? lucroTotal / diasAtivosDetalhados.length
          : 0,
      diasAtivos: diasAtivosDetalhados.length,
    };
  }, [tipoLancamento, modoIntervalo, diasAtivosDetalhados]);

  function adicionarInsumoLinha() {
    setInsumosSelecionados((prev) => [...prev, createEmptyInsumoSelecionado()]);
  }

  function removerInsumoLinha(id: string) {
    setInsumosSelecionados((prev) => prev.filter((item) => item.id !== id));
  }

  function atualizarInsumoLinha(
    id: string,
    campo: keyof Omit<InsumoSelecionado, "id">,
    valor: string
  ) {
    setInsumosSelecionados((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const atualizado = { ...item, [campo]: valor };

        if (campo === "insumoId") {
          const insumoSelecionado = insumos.find((insumo) => insumo.id === valor);
          atualizado.valorUnitario = String(
            Number(insumoSelecionado?.valor_base ?? 0)
          );
        }

        return atualizado;
      })
    );
  }

  function adicionarCustoManual() {
    setCustosManuais((prev) => [...prev, createEmptyCustoManual()]);
  }

  function removerCustoManual(id: string) {
    setCustosManuais((prev) => prev.filter((item) => item.id !== id));
  }

  function atualizarCustoManual(
    id: string,
    campo: keyof Omit<CustoManualItem, "id">,
    valor: string
  ) {
    setCustosManuais((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const atualizado = { ...item, [campo]: valor };

        if (campo === "categoriaId") {
          const categoriaSelecionada = categorias.find(
            (categoria) => categoria.id === valor
          );

          if (categoriaSelecionada) {
            atualizado.descricao =
              categoriaSelecionada.descricao_padrao ??
              categoriaSelecionada.nome;

            if (
              categoriaSelecionada.usar_valor_padrao &&
              categoriaSelecionada.valor_padrao != null
            ) {
              atualizado.valor = String(categoriaSelecionada.valor_padrao);
            }
          }
        }

        return atualizado;
      })
    );
  }

  function atualizarDia(
    dataDia: string,
    campo: keyof Omit<DiaDetalhado, "custos">,
    valor: string | boolean
  ) {
    setDiasDetalhados((prev) =>
      prev.map((dia) =>
        dia.data === dataDia ? { ...dia, [campo]: valor } : dia
      )
    );
  }

  function alternarDiaAtivo(dataDia: string) {
    setDiasDetalhados((prev) =>
      prev.map((dia) =>
        dia.data === dataDia ? { ...dia, ativo: !dia.ativo } : dia
      )
    );
  }

  function replicarDescricaoParaOutrosDias(dataOrigem: string) {
    setDiasDetalhados((prev) => {
      const diaOrigem = prev.find((dia) => dia.data === dataOrigem);
      if (!diaOrigem) return prev;

      return prev.map((dia) =>
        dia.data === dataOrigem
          ? dia
          : { ...dia, descricao: diaOrigem.descricao }
      );
    });
  }

  function adicionarCusto(dataDia: string) {
    setDiasDetalhados((prev) =>
      prev.map((dia) =>
        dia.data === dataDia
          ? { ...dia, custos: [...dia.custos, createEmptyCost()] }
          : dia
      )
    );
  }

  function removerCusto(dataDia: string, custoId: string) {
    setDiasDetalhados((prev) =>
      prev.map((dia) => {
        if (dia.data !== dataDia) return dia;

        return {
          ...dia,
          custos: dia.custos.filter((custo) => custo.id !== custoId),
        };
      })
    );
  }

  function atualizarCusto(
    dataDia: string,
    custoId: string,
    campo: keyof Omit<CustoDia, "id">,
    valor: string
  ) {
    setDiasDetalhados((prev) =>
      prev.map((dia) => {
        if (dia.data !== dataDia) return dia;

        return {
          ...dia,
          custos: dia.custos.map((custo) => {
            if (custo.id !== custoId) return custo;

            const custoAtualizado = { ...custo, [campo]: valor };

            if (campo === "categoriaId") {
              const categoriaSelecionada = categorias.find(
                (categoria) => categoria.id === valor
              );

              if (categoriaSelecionada) {
                custoAtualizado.descricao =
                  categoriaSelecionada.descricao_padrao ??
                  categoriaSelecionada.nome;

                if (
                  categoriaSelecionada.usar_valor_padrao &&
                  categoriaSelecionada.valor_padrao != null
                ) {
                  custoAtualizado.valor = String(
                    categoriaSelecionada.valor_padrao
                  );
                }
              }
            }

            return custoAtualizado;
          }),
        };
      })
    );
  }

  async function handleSalvar() {
    try {
      setErro("");

      const perfilSelecionado =
        perfisMock.find((perfil) => perfil.id === perfilId)?.nome ?? "";

      if (
        (tipoLancamento === "unico" || modoIntervalo === "resumo") &&
        !descricao.trim()
      ) {
        throw new Error("Informe a descrição.");
      }

      if (tipoLancamento === "unico") {
        if (valorRecebidoNumero <= 0) {
          throw new Error("Informe um valor recebido maior que zero.");
        }

        await criarLancamentosRendaVariavel([
          {
            data,
            descricao,
            tipoRv,
            perfil: perfilSelecionado,
            cliente,
            valorRecebido: valorRecebidoNumero,
            horasTrabalhadas: horasTrabalhadasNumero,
            quantidade: quantidadeNumero,
            custoManualDescricao: custosManuaisValidos
              .map((item) => item.descricao)
              .join(" | "),
            custoManualValor: custoManualNumero,
            custoInsumos,
            custoTotal,
            lucroLiquido,
            lucroPorHora,
            margem,
            itens: itensCalculados.map((item) => ({
              insumoNome: item.nome,
              unidade: item.unidade,
              valorBase: item.valorBase,
              quantidade: item.quantidade,
              total: item.total,
            })),
            custosDetalhados: custosManuaisValidos,
          },
        ]);

        return;
      }

      if (!dataInicio || !dataFim) {
        throw new Error("Informe a data inicial e final.");
      }

      if (diasNoIntervalo <= 0) {
        throw new Error("O intervalo informado é inválido.");
      }

      if (modoIntervalo === "resumo") {
        if (valorRecebidoNumero <= 0) {
          throw new Error("Informe um valor total recebido maior que zero.");
        }

        const recebidoPorDia = distributeAmount(valorRecebidoNumero, diasNoIntervalo);
        const horasPorDia = distributeAmount(horasTrabalhadasNumero, diasNoIntervalo);
        const quantidadePorDia = distributeAmount(quantidadeNumero, diasNoIntervalo);
        const custoManualPorDia = distributeAmount(custoManualNumero, diasNoIntervalo);

        const insumosPorDia = itensCalculados.map((item) => ({
          ...item,
          quantidadesDistribuidas: distributeAmount(item.quantidade, diasNoIntervalo),
          totaisDistribuidos: distributeAmount(item.total, diasNoIntervalo),
        }));

        const lancamentos = datasDoIntervalo.map((dataItem, index) => {
          const itensDoDia = insumosPorDia
            .map((item) => ({
              insumoNome: item.nome,
              unidade: item.unidade,
              valorBase: item.valorBase,
              quantidade: item.quantidadesDistribuidas[index] ?? 0,
              total: item.totaisDistribuidos[index] ?? 0,
            }))
            .filter((item) => item.quantidade > 0 || item.total > 0);

          const custoInsumosDia = itensDoDia.reduce(
            (acc, item) => acc + item.total,
            0
          );
          const custoManualDia = custoManualPorDia[index] ?? 0;
          const custoTotalDia = custoInsumosDia + custoManualDia;
          const recebidoDia = recebidoPorDia[index] ?? 0;
          const horasDia = horasPorDia[index] ?? 0;
          const quantidadeDia = quantidadePorDia[index] ?? 0;
          const lucroDia = recebidoDia - custoTotalDia;
          const lucroHoraDia = horasDia > 0 ? lucroDia / horasDia : 0;
          const margemDia = recebidoDia > 0 ? (lucroDia / recebidoDia) * 100 : 0;

          const custosDetalhadosDia =
            custoManualDia > 0
              ? [
                  {
                    categoriaId: null,
                    categoriaNome: "Custos manuais rateados",
                    descricao: "Rateio de custos manuais do período",
                    valor: custoManualDia,
                  },
                ]
              : [];

          return {
            data: dataItem,
            descricao,
            tipoRv,
            perfil: perfilSelecionado,
            cliente,
            valorRecebido: recebidoDia,
            horasTrabalhadas: horasDia,
            quantidade: quantidadeDia,
            custoManualDescricao: custosManuaisValidos
              .map((item) => item.descricao)
              .join(" | "),
            custoManualValor: custoManualDia,
            custoInsumos: custoInsumosDia,
            custoTotal: custoTotalDia,
            lucroLiquido: lucroDia,
            lucroPorHora: lucroHoraDia,
            margem: margemDia,
            itens: itensDoDia,
            custosDetalhados: custosDetalhadosDia,
          };
        });

        await criarLancamentosRendaVariavel(lancamentos);
        return;
      }

      if (diasDetalhados.length === 0) {
        throw new Error("Nenhum dia encontrado para o intervalo.");
      }

      if (diasAtivosDetalhados.length === 0) {
        throw new Error("Selecione pelo menos um dia para considerar no lançamento.");
      }

      const lancamentosDiaADia = diasAtivosDetalhados.map((dia) => {
        const valorDia = Number(dia.valorRecebido) || 0;
        const horasDia = parseHorasToDecimal(dia.horas);
        const quantidadeDia = Number(dia.quantidade) || 0;

        const custosDetalhados = dia.custos
          .map((custo) => {
            const categoria = categorias.find(
              (categoriaItem) => categoriaItem.id === custo.categoriaId
            );

            return {
              categoriaId: categoria?.id ?? null,
              categoriaNome: categoria?.nome ?? "",
              descricao: custo.descricao.trim(),
              valor: Number(custo.valor) || 0,
            };
          })
          .filter(
            (custo) =>
              custo.categoriaNome &&
              custo.descricao &&
              custo.valor > 0
          );

        const custoTotalDia = custosDetalhados.reduce(
          (acc, custo) => acc + custo.valor,
          0
        );

        const lucroDia = valorDia - custoTotalDia;
        const lucroHoraDia = horasDia > 0 ? lucroDia / horasDia : 0;
        const margemDia = valorDia > 0 ? (lucroDia / valorDia) * 100 : 0;

        return {
          data: dia.data,
          descricao: dia.descricao.trim() || descricao,
          tipoRv,
          perfil: perfilSelecionado,
          cliente,
          valorRecebido: valorDia,
          horasTrabalhadas: horasDia,
          quantidade: quantidadeDia,
          observacao: dia.observacao,
          custoManualDescricao: "",
          custoManualValor: 0,
          custoInsumos: 0,
          custoTotal: custoTotalDia,
          lucroLiquido: lucroDia,
          lucroPorHora: lucroHoraDia,
          margem: margemDia,
          itens: [],
          custosDetalhados,
        };
      });

      const algumDiaSemValor = lancamentosDiaADia.some(
        (dia) => dia.valorRecebido <= 0
      );

      if (algumDiaSemValor) {
        throw new Error(
          "Todos os dias considerados precisam ter valor recebido maior que zero."
        );
      }

      await criarLancamentosRendaVariavel(lancamentosDiaADia);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao salvar lançamento.";
      setErro(message);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Link
                href="/renda-variavel"
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para renda variável
              </Link>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Novo lançamento
                </div>

                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
                    Registrar renda variável
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm text-zinc-600 md:text-base">
                    Registre um dia único, um resumo do período ou preencha dia
                    por dia com custos categorizados.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => startTransition(handleSalvar)}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isPending ? "Salvando..." : "Salvar lançamento"}
            </button>
          </div>

          {erro ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </div>
          ) : null}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col gap-6">
            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-zinc-900">
                  Tipo de lançamento
                </h2>
                <p className="text-sm text-zinc-500">
                  Escolha se quer registrar um único dia ou um intervalo.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setTipoLancamento("unico");
                    setModoIntervalo("resumo");
                  }}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    tipoLancamento === "unico"
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  <p className="text-sm font-semibold">Dia único</p>
                  <p
                    className={`mt-1 text-sm ${
                      tipoLancamento === "unico"
                        ? "text-zinc-200"
                        : "text-zinc-500"
                    }`}
                  >
                    Para registrar apenas uma data.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoLancamento("intervalo")}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    tipoLancamento === "intervalo"
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  <p className="text-sm font-semibold">Intervalo de dias</p>
                  <p
                    className={`mt-1 text-sm ${
                      tipoLancamento === "intervalo"
                        ? "text-zinc-200"
                        : "text-zinc-500"
                    }`}
                  >
                    Para lançar vários dias de uma vez.
                  </p>
                </button>
              </div>

              {tipoLancamento === "intervalo" ? (
                <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white p-2 text-zinc-700">
                      <CalendarRange className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">
                        Modo do intervalo
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        Escolha entre resumir o período inteiro ou preencher dia
                        por dia com custos detalhados.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setModoIntervalo("resumo")}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        modoIntervalo === "resumo"
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
                      }`}
                    >
                      <p className="text-sm font-semibold">Resumo do período</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModoIntervalo("dia-a-dia")}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        modoIntervalo === "dia-a-dia"
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
                      }`}
                    >
                      <p className="text-sm font-semibold">Preencher dia a dia</p>
                    </button>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-zinc-900">
                  Dados principais
                </h2>
                <p className="text-sm text-zinc-500">
                  Informações centrais do lançamento.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {tipoLancamento === "unico" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">
                      Data
                    </label>
                    <input
                      type="date"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                    />
                  </div>
                  ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">
                        Data inicial
                      </label>
                      <input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">
                        Data final
                      </label>
                      <input
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">
                    Perfil
                  </label>
                  <select
                    value={perfilId}
                    onChange={(e) => setPerfilId(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
                  >
                    {perfisMock.map((perfil) => (
                      <option key={perfil.id} value={perfil.id}>
                        {perfil.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {modoIntervalo !== "dia-a-dia" && (
                  <>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-zinc-700">
                        Descrição
                      </label>
                      <input
                        type="text"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Ex.: Corridas do dia, bolo aniversário, projeto social media..."
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-zinc-700">
                        {tipoLancamento === "unico"
                          ? "Valor recebido"
                          : "Valor total recebido no período"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={valorRecebido}
                        onChange={(e) => setValorRecebido(e.target.value)}
                        placeholder="0,00"
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
                      />
                    </div>
                  </>
                )}
              </div>
            </section>

            {modoIntervalo !== "dia-a-dia" && (
              <>
                <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-start gap-3">
                    <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
                      <UserRound className="h-4 w-4" />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-zinc-900">
                        Contexto do trabalho
                      </h2>
                      <p className="text-sm text-zinc-500">
                        Campos auxiliares para detalhar melhor esse registro.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">
                        Cliente
                      </label>
                      <input
                        type="text"
                        value={cliente}
                        onChange={(e) => setCliente(e.target.value)}
                        placeholder="Opcional"
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
  <label className="text-sm font-medium text-zinc-700">
    Tipo de lançamento financeiro
  </label>
  <select
    value={tipoRv}
    onChange={(e) => setTipoRv(e.target.value as TipoRvLancamento)}
    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
  >
    {Object.entries(TIPO_RV_LABEL).map(([value, label]) => (
      <option key={value} value={value}>
        {label}
      </option>
    ))}
  </select>
</div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">
                        {tipoLancamento === "unico"
                          ? "Horas trabalhadas"
                          : "Horas totais do período"}
                      </label>
                      <input
                        type="text"
                        value={horasTrabalhadas}
                        onChange={(e) => setHorasTrabalhadas(e.target.value)}
                        onBlur={(e) =>
                          setHorasTrabalhadas(normalizarHorasInput(e.target.value))
                        }
                        placeholder="00h00min"
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">
                        {tipoLancamento === "unico"
                          ? "Quantidade"
                          : "Quantidade total"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        placeholder="Opcional"
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
                        <Package className="h-4 w-4" />
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-zinc-900">
                          Insumos e custos base
                        </h2>
                        <p className="text-sm text-zinc-500">
                          Escolha só os insumos que realmente quer usar neste lançamento.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={adicionarInsumoLinha}
                      className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar insumo
                    </button>
                  </div>

                  {insumosSelecionados.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center">
                      <p className="text-sm font-medium text-zinc-900">
                        Nenhum insumo adicionado neste lançamento.
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        Clique em “Adicionar insumo” para escolher o que deseja usar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {insumosSelecionados.map((linha) => {
                        const insumoSelecionado = insumos.find(
                          (item) => item.id === linha.insumoId
                        );
                        const quantidadeLinha = Number(linha.quantidade || 0);
                        const valorUnitarioLinha = Number(linha.valorUnitario || 0);
                        const totalLinha = quantidadeLinha * valorUnitarioLinha;

                        return (
                          <div
                            key={linha.id}
                            className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-[1.2fr_0.7fr_0.8fr_0.8fr_0.8fr_auto]"
                          >
                            <div className="space-y-2">
                              <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                Insumo
                              </label>
                              <select
                                value={linha.insumoId}
                                onChange={(e) =>
                                  atualizarInsumoLinha(
                                    linha.id,
                                    "insumoId",
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                              >
                                <option value="">Selecione</option>
                                {insumos.map((insumo) => (
                                  <option key={insumo.id} value={insumo.id}>
                                    {insumo.nome}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                Unidade
                              </label>
                              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900">
                                {insumoSelecionado?.unidade ?? "—"}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                Quantidade
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={linha.quantidade}
                                onChange={(e) =>
                                  atualizarInsumoLinha(
                                    linha.id,
                                    "quantidade",
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                Valor Und
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={linha.valorUnitario}
                                onChange={(e) =>
                                  atualizarInsumoLinha(
                                    linha.id,
                                    "valorUnitario",
                                    e.target.value
                                  )
                                }
                                placeholder="0,00"
                                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                Total
                              </label>
                              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900">
                                {formatCurrency(totalLinha)}
                              </div>
                            </div>

                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => removerInsumoLinha(linha.id)}
                                className="inline-flex items-center justify-center rounded-2xl border border-red-200 px-3 py-3 text-red-600 transition hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
                        <Receipt className="h-4 w-4" />
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-zinc-900">
                          Custos manuais adicionais
                        </h2>
                        <p className="text-sm text-zinc-500">
                          Adicione quantos custos quiser, com categoria, descrição e valor.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={adicionarCustoManual}
                      className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar custo
                    </button>
                  </div>

                  {custosManuais.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center">
                      <p className="text-sm font-medium text-zinc-900">
                        Nenhum custo manual adicionado.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {custosManuais.map((custo) => (
                        <div
                          key={custo.id}
                          className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-[0.9fr_1.3fr_0.8fr_auto]"
                        >
                          <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                              Categoria
                            </label>
                            <select
                              value={custo.categoriaId}
                              onChange={(e) =>
                                atualizarCustoManual(
                                  custo.id,
                                  "categoriaId",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                            >
                              <option value="">Selecione</option>
                              {categorias.map((categoria) => (
                                <option key={categoria.id} value={categoria.id}>
                                  {categoria.nome}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                              Descrição
                            </label>
                            <input
                              type="text"
                              value={custo.descricao}
                              onChange={(e) =>
                                atualizarCustoManual(
                                  custo.id,
                                  "descricao",
                                  e.target.value
                                )
                              }
                              placeholder="Ex.: estacionamento, entrega extra, material avulso..."
                              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                              Valor
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={custo.valor}
                              onChange={(e) =>
                                atualizarCustoManual(
                                  custo.id,
                                  "valor",
                                  e.target.value
                                )
                              }
                              placeholder="0,00"
                              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                            />
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removerCustoManual(custo.id)}
                              className="inline-flex items-center justify-center rounded-2xl border border-red-200 px-3 py-3 text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

            {tipoLancamento === "intervalo" && modoIntervalo === "dia-a-dia" && (
              <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-zinc-900">
                    Preenchimento dia a dia
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Informe os valores de cada data e adicione quantos custos
                    quiser por dia.
                  </p>
                </div>

                {diasDetalhados.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center">
                    <p className="text-sm font-medium text-zinc-900">
                      Informe um intervalo válido para começar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {diasDetalhados.map((dia) => {
                      const totalCustosDia = dia.custos.reduce(
                        (acc, custo) => acc + (Number(custo.valor) || 0),
                        0
                      );
                      const valorDia = Number(dia.valorRecebido) || 0;
                      const lucroDia = valorDia - totalCustosDia;

                      return (
                        <div
                          key={dia.data}
                          className={`rounded-3xl border p-5 transition ${
                            dia.ativo
                              ? "border-zinc-200 bg-zinc-50"
                              : "border-zinc-200 bg-zinc-100 opacity-70"
                          }`}
                        >
                          <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-base font-semibold text-zinc-900">
                                {dia.data}
                              </h3>
                              <p className="text-sm text-zinc-500">
                                Total de custos: {formatCurrency(totalCustosDia)}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700">
                                <input
                                  type="checkbox"
                                  checked={dia.ativo}
                                  onChange={() => alternarDiaAtivo(dia.data)}
                                  className="h-4 w-4"
                                />
                                Considerar dia
                              </label>

                              <div className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-zinc-900">
                                Lucro do dia: {formatCurrency(lucroDia)}
                              </div>
                            </div>
                          </div>

                          <div className={dia.ativo ? "" : "pointer-events-none"}>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2 md:col-span-2">
                                <div className="flex items-center justify-between gap-3">
                                  <label className="text-sm font-medium text-zinc-700">
                                    Descrição do dia
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => replicarDescricaoParaOutrosDias(dia.data)}
                                    className="text-xs font-medium text-zinc-600 transition hover:text-zinc-900"
                                  >
                                    Replicar descrição nos outros dias
                                  </button>
                                </div>

                                <input
                                  type="text"
                                  value={dia.descricao}
                                  onChange={(e) =>
                                    atualizarDia(dia.data, "descricao", e.target.value)
                                  }
                                  placeholder="Ex.: Corridas do dia"
                                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700">
                                  Valor recebido
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={dia.valorRecebido}
                                  onChange={(e) =>
                                    atualizarDia(
                                      dia.data,
                                      "valorRecebido",
                                      e.target.value
                                    )
                                  }
                                  placeholder="0,00"
                                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700">
                                  Horas trabalhadas
                                </label>
                                <input
                                  type="text"
                                  value={dia.horas}
                                  onChange={(e) =>
                                    atualizarDia(dia.data, "horas", e.target.value)
                                  }
                                  onBlur={(e) =>
                                    atualizarDia(
                                      dia.data,
                                      "horas",
                                      normalizarHorasInput(e.target.value)
                                    )
                                  }
                                  placeholder="00h00min"
                                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700">
                                  Quantidade
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={dia.quantidade}
                                  onChange={(e) =>
                                    atualizarDia(
                                      dia.data,
                                      "quantidade",
                                      e.target.value
                                    )
                                  }
                                  placeholder="0"
                                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                                />
                              </div>

                              <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-zinc-700">
                                  Observação
                                </label>
                                <input
                                  type="text"
                                  value={dia.observacao}
                                  onChange={(e) =>
                                    atualizarDia(
                                      dia.data,
                                      "observacao",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Opcional"
                                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                                />
                              </div>
                            </div>

                            <div className="mt-5">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                  <h4 className="text-sm font-semibold text-zinc-900">
                                    Custos do dia
                                  </h4>
                                  <p className="text-xs text-zinc-500">
                                    Adicione vários custos com categoria.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => adicionarCusto(dia.data)}
                                  className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                                >
                                  <Plus className="h-4 w-4" />
                                  Adicionar custo
                                </button>
                              </div>

                              {dia.custos.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-6 text-center">
                                  <p className="text-sm text-zinc-500">
                                    Nenhum custo adicionado neste dia.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {dia.custos.map((custo) => (
                                    <div
                                      key={custo.id}
                                      className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 md:grid-cols-[1fr_1.2fr_0.8fr_auto]"
                                    >
                                      <div className="space-y-2">
                                        <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                          Categoria
                                        </label>
                                        <select
                                          value={custo.categoriaId}
                                          onChange={(e) =>
                                            atualizarCusto(
                                              dia.data,
                                              custo.id,
                                              "categoriaId",
                                              e.target.value
                                            )
                                          }
                                          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                                        >
                                          <option value="">Selecione</option>
                                          {categorias.map((categoria) => (
                                            <option
                                              key={categoria.id}
                                              value={categoria.id}
                                            >
                                              {categoria.nome}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="space-y-2">
                                        <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                          Descrição
                                        </label>
                                        <input
                                          type="text"
                                          value={custo.descricao}
                                          onChange={(e) =>
                                            atualizarCusto(
                                              dia.data,
                                              custo.id,
                                              "descricao",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Ex.: Gasolina, almoço, estacionamento..."
                                          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                          Valor
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={custo.valor}
                                          onChange={(e) =>
                                            atualizarCusto(
                                              dia.data,
                                              custo.id,
                                              "valor",
                                              e.target.value
                                            )
                                          }
                                          placeholder="0,00"
                                          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
                                        />
                                      </div>

                                      <div className="flex items-end">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removerCusto(dia.data, custo.id)
                                          }
                                          className="inline-flex items-center justify-center rounded-2xl border border-red-200 px-3 py-3 text-red-600 transition hover:bg-red-50"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm xl:sticky xl:top-6">
              <div className="mb-5 flex items-start gap-3">
                <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
                  <Calculator className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">
                    Resumo do lançamento
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Cálculo automático em tempo real.
                  </p>
                </div>
              </div>

              {tipoLancamento === "intervalo" ? (
                <div className="mb-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-sm font-medium text-zinc-900">
                    Intervalo selecionado
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {dataInicio || "—"} até {dataFim || "—"}
                  </p>
                  <p className="mt-2 text-sm text-zinc-700">
                    {diasNoIntervalo > 0
                      ? `${diasNoIntervalo} dia(s) no intervalo`
                      : "Informe um intervalo válido"}
                  </p>

                  {modoIntervalo === "dia-a-dia" ? (
                    <p className="mt-1 text-sm text-zinc-700">
                      {resumoDiaADia?.diasAtivos ?? 0} dia(s) considerados no lançamento
                    </p>
                  ) : null}
                </div>
              ) : null}

              {tipoLancamento === "unico" || modoIntervalo === "resumo" ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
                      <span className="text-sm text-zinc-600">
                        {tipoLancamento === "unico"
                          ? "Valor recebido"
                          : "Valor total do período"}
                      </span>
                      <span className="text-sm font-medium text-zinc-900">
                        {formatCurrency(valorRecebidoNumero)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
                      <span className="text-sm text-zinc-600">
                        Custos dos insumos
                      </span>
                      <span className="text-sm font-medium text-zinc-900">
                        {formatCurrency(custoInsumos)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
                      <span className="text-sm text-zinc-600">
                        Custos manuais
                      </span>
                      <span className="text-sm font-medium text-zinc-900">
                        {formatCurrency(custoManualNumero)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-zinc-100 px-4 py-3">
                      <span className="text-sm font-medium text-zinc-700">
                        Custo total
                      </span>
                      <span className="text-sm font-semibold text-zinc-900">
                        {formatCurrency(custoTotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
                      <span className="text-sm font-medium text-emerald-800">
                        Lucro líquido
                      </span>
                      <span className="text-sm font-semibold text-emerald-800">
                        {formatCurrency(lucroLiquido)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        {tipoLancamento === "unico"
                          ? "Lucro por hora"
                          : "Lucro por hora médio"}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-zinc-500" />
                        <p className="text-lg font-semibold text-zinc-900">
                          {formatCurrency(lucroPorHora)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Margem
                      </p>
                      <p className="mt-2 text-lg font-semibold text-zinc-900">
                        {margem.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {tipoLancamento === "intervalo" && previewPorDia ? (
                    <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-sm font-semibold text-zinc-900">
                        Média por dia no intervalo
                      </p>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-600">Recebido por dia</span>
                          <span className="font-medium text-zinc-900">
                            {formatCurrency(previewPorDia.recebido)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-600">Custo por dia</span>
                          <span className="font-medium text-zinc-900">
                            {formatCurrency(previewPorDia.custoTotal)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-600">Lucro por dia</span>
                          <span className="font-medium text-zinc-900">
                            {formatCurrency(previewPorDia.lucro)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
                      <span className="text-sm text-zinc-600">Total recebido</span>
                      <span className="text-sm font-medium text-zinc-900">
                        {formatCurrency(resumoDiaADia?.totalRecebido ?? 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
                      <span className="text-sm text-zinc-600">Total de custos</span>
                      <span className="text-sm font-medium text-zinc-900">
                        {formatCurrency(resumoDiaADia?.totalCustos ?? 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-zinc-100 px-4 py-3">
                      <span className="text-sm font-medium text-zinc-700">
                        Lucro total
                      </span>
                      <span className="text-sm font-semibold text-zinc-900">
                        {formatCurrency(resumoDiaADia?.lucroTotal ?? 0)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Lucro por hora médio
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-zinc-500" />
                        <p className="text-lg font-semibold text-zinc-900">
                          {formatCurrency(resumoDiaADia?.lucroHoraMedio ?? 0)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Margem
                      </p>
                      <p className="mt-2 text-lg font-semibold text-zinc-900">
                        {(resumoDiaADia?.margemMedia ?? 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm font-semibold text-zinc-900">
                      Média de lucro por dia
                    </p>
                    <p className="mt-2 text-lg font-semibold text-zinc-900">
                      {formatCurrency(resumoDiaADia?.mediaPorDia ?? 0)}
                    </p>
                  </div>
                </>
              )}

              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-800">
                  {tipoLancamento === "unico"
                    ? "Esse lucro será salvo no módulo de renda variável."
                    : modoIntervalo === "resumo"
                    ? "Esse resumo será dividido automaticamente e salvo como um lançamento por dia."
                    : "Cada dia considerado será salvo separadamente com seus custos detalhados por categoria."}
                </p>
                <p className="mt-1 text-sm text-emerald-700">
                  Depois você escolhe se quer transferir para o financeiro geral
                  ou guardar em meta.
                </p>
              </div>

              <button
                type="button"
                onClick={() => startTransition(handleSalvar)}
                disabled={isPending}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isPending ? "Salvando..." : "Salvar lançamento"}
              </button>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}