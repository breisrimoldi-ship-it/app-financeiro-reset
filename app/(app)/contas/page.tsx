"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlarmClock,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Pencil,
  Plus,
  Power,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getHojeISO, getMesAtualISO } from "@/lib/finance/date";
import { formatarMoedaBRL } from "@/lib/finance/format"

type TipoRecorrencia = "indeterminada" | "temporaria";
type AbaFiltro = "todas" | "ativas" | "inativas";
type PrazoModo = "quantidade" | "fim";

type ContaFixa = {
  id: number;
  descricao: string;
  valor: number;
  dia_vencimento: number;
  categoria: string | null;
  observacoes: string | null;
  ativa: boolean;
  user_id: string | null;
  tipo_recorrencia: TipoRecorrencia;
  inicio_cobranca: string | null;
  fim_cobranca: string | null;
  quantidade_meses: number | null;
  created_at: string;
  updated_at: string;
};

type PagamentoConta = {
  id: number;
  origem_tipo: string;
  origem_id: number;
  mes_referencia: string;
  valor_pago: number;
  data_pagamento: string | null;
  status: string;
  observacoes?: string | null;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

function getMesAtual() {
  return getMesAtualISO()
}

function getDataHoje() {
  return getHojeISO();
}

const formatarMoeda = formatarMoedaBRL;

function formatarMesAno(anoMes: string | null) {
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

function formatarData(data: string | null) {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function adicionarMeses(anoMes: string, quantidade: number) {
  const [ano, mes] = anoMes.split("-").map(Number);
  const data = new Date(ano, mes - 1 + quantidade, 1);

  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function diferencaMeses(inicio: string, fim: string) {
  const [anoInicio, mesInicio] = inicio.split("-").map(Number);
  const [anoFim, mesFim] = fim.split("-").map(Number);

  return (anoFim - anoInicio) * 12 + (mesFim - mesInicio);
}

function getUltimoMesConta(conta: ContaFixa) {
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

function contaExisteNoMes(conta: ContaFixa, mesReferencia: string) {
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

function contaAtivaNoMes(conta: ContaFixa, mesReferencia: string) {
  return conta.ativa && contaExisteNoMes(conta, mesReferencia);
}

function getMesesRestantes(conta: ContaFixa, mesReferencia: string) {
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

function pagamentoEhAdiantado(
  pagamento: PagamentoConta | undefined,
  mesReferencia: string
) {
  if (!pagamento?.data_pagamento) return false;
  const mesPagamento = pagamento.data_pagamento.slice(0, 7);
  return mesPagamento < mesReferencia;
}

function normalizarCategoria(valor: string) {
  const texto = valor.replace(/\s+/g, " ").trim().toLowerCase();
  if (!texto) return "";

  return texto
    .split(" ")
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

function ordenarPorVencimento(a: ContaFixa, b: ContaFixa) {
  if (a.ativa !== b.ativa) return a.ativa ? -1 : 1;
  if (a.dia_vencimento !== b.dia_vencimento) {
    return a.dia_vencimento - b.dia_vencimento;
  }
  return a.descricao.localeCompare(b.descricao);
}

function cls(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ResumoCardProps = {
  titulo: string;
  valor: string | number;
  descricao: string;
  icon: React.ReactNode;
  destaque?: "default" | "blue" | "amber" | "sky";
};

function ResumoCard({
  titulo,
  valor,
  descricao,
  icon,
  destaque = "default",
}: ResumoCardProps) {
  const estilos =
    destaque === "blue"
      ? "border-blue-100 bg-gradient-to-br from-blue-50 to-white"
      : destaque === "amber"
      ? "border-amber-100 bg-gradient-to-br from-amber-50 to-white"
      : destaque === "sky"
      ? "border-sky-100 bg-gradient-to-br from-sky-50 to-white"
      : "border-slate-200 bg-gradient-to-br from-slate-50 to-white";

  const valorCor =
    destaque === "blue"
      ? "text-blue-700"
      : destaque === "amber"
      ? "text-amber-600"
      : destaque === "sky"
      ? "text-sky-600"
      : "text-slate-900";

  return (
    <div className={cls("rounded-[28px] border p-5 shadow-sm", estilos)}>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        {icon}
        <span>{titulo}</span>
      </div>
      <p className={cls("mt-4 text-3xl font-semibold tracking-tight", valorCor)}>
        {valor}
      </p>
      <p className="mt-2 text-xs text-slate-400">{descricao}</p>
    </div>
  );
}

type ContaCardProps = {
  conta: ContaFixa;
  mesSelecionado: string;
  pagamentoMes?: PagamentoConta;
  estaPagando: boolean;
  onEditar: () => void;
  onPagar: () => void;
  onDesfazerPagamento: () => void;
  onAlternarStatus: () => void;
  onExcluir: () => void;
};

function ContaCard({
  conta,
  mesSelecionado,
  pagamentoMes,
  estaPagando,
  onEditar,
  onPagar,
  onDesfazerPagamento,
  onAlternarStatus,
  onExcluir,
}: ContaCardProps) {
  const entraNoMes = contaAtivaNoMes(conta, mesSelecionado);
  const existeNoMes = contaExisteNoMes(conta, mesSelecionado);
  const pago = !!pagamentoMes && pagamentoMes.status === "paga";
  const adiantado = pagamentoEhAdiantado(pagamentoMes, mesSelecionado);
  const mesesRestantes = getMesesRestantes(conta, mesSelecionado);
  const totalRestante =
    conta.tipo_recorrencia === "temporaria"
      ? Number(conta.valor) * mesesRestantes
      : 0;

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={cls(
                "flex h-11 w-11 items-center justify-center rounded-2xl",
                conta.ativa
                  ? "bg-blue-50 text-blue-600"
                  : "bg-slate-100 text-slate-500"
              )}
            >
              <CreditCard className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-900">
                {conta.descricao}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                <span
                  className={cls(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium",
                    conta.ativa
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-700"
                  )}
                >
                  {conta.ativa ? "Ativa" : "Inativa"}
                </span>

                <span
                  className={cls(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium",
                    conta.tipo_recorrencia === "temporaria"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-700"
                  )}
                >
                  {conta.tipo_recorrencia === "temporaria"
                    ? "Temporária"
                    : "Recorrente"}
                </span>

                {pago ? (
                  <span
                    className={cls(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium",
                      adiantado
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {adiantado ? "Paga adiantada" : "Paga"}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              <Calendar className="h-3.5 w-3.5" />
              Vence dia {conta.dia_vencimento}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              <AlarmClock className="h-3.5 w-3.5" />
              Início {formatarMesAno(conta.inicio_cobranca)}
            </span>

            {conta.categoria ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                <Tag className="h-3.5 w-3.5" />
                {conta.categoria}
              </span>
            ) : null}

            <span
              className={cls(
                "rounded-full px-2.5 py-1 text-[11px] font-medium",
                existeNoMes
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-500"
              )}
            >
              {existeNoMes
                ? `Existe em ${formatarMesAno(mesSelecionado)}`
                : `Fora de ${formatarMesAno(mesSelecionado)}`}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            {conta.tipo_recorrencia === "temporaria" ? (
              <>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  Prazo:{" "}
                  {conta.quantidade_meses
                    ? `${conta.quantidade_meses} mês(es)`
                    : `até ${formatarMesAno(conta.fim_cobranca)}`}
                </span>

                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  Restante: {formatarMoeda(totalRestante)}
                </span>

                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  {mesesRestantes} mês(es) restantes
                </span>
              </>
            ) : (
              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                Cobrança contínua
              </span>
            )}

            {pago && pagamentoMes?.data_pagamento ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                Pago em {formatarData(pagamentoMes.data_pagamento)}
              </span>
            ) : null}
          </div>

          {conta.observacoes ? (
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {conta.observacoes}
            </p>
          ) : null}

          {entraNoMes ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {pago ? (
                <button
                  type="button"
                  onClick={onDesfazerPagamento}
                  disabled={estaPagando}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {estaPagando ? "Desfazendo..." : "Desfazer pagamento"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onPagar}
                  disabled={estaPagando}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {estaPagando ? "Pagando..." : "Pagar"}
                </button>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
          <div className="text-left lg:text-right">
            <p className="text-xl font-semibold text-slate-900">
              {formatarMoeda(Number(conta.valor))}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
              conta
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onEditar}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </button>

            <button
              type="button"
              onClick={onAlternarStatus}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <Power className="h-4 w-4" />
              {conta.ativa ? "Inativar" : "Ativar"}
            </button>

            <button
              type="button"
              onClick={onExcluir}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContasPage() {
    const supabase = createClient();
  const [contas, setContas] = useState<ContaFixa[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoConta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<AbaFiltro>("todas");
  const [mesSelecionado, setMesSelecionado] = useState(getMesAtual());
  const [pagandoKey, setPagandoKey] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [diaVencimento, setDiaVencimento] = useState("");
  const [categoria, setCategoria] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [ativa, setAtiva] = useState(true);

  const [tipoRecorrencia, setTipoRecorrencia] =
    useState<TipoRecorrencia>("indeterminada");
  const [inicioCobranca, setInicioCobranca] = useState("");
  const [prazoModo, setPrazoModo] = useState<PrazoModo>("quantidade");
  const [quantidadeMeses, setQuantidadeMeses] = useState("");
  const [fimCobranca, setFimCobranca] = useState("");

  const carregarPagina = useCallback(async () => {
    setCarregando(true);
    setErro("");

    const [
      { data: contasData, error: contasError },
      { data: pagamentosData, error: pagamentosError },
    ] = await Promise.all([
      supabase
        .from("contas_fixas")
        .select(
          "id, descricao, valor, dia_vencimento, categoria, observacoes, ativa, user_id, tipo_recorrencia, inicio_cobranca, fim_cobranca, quantidade_meses, created_at, updated_at"
        )
        .order("dia_vencimento", { ascending: true })
        .order("descricao", { ascending: true }),

      supabase
        .from("pagamentos_contas")
        .select(
          "id, origem_tipo, origem_id, mes_referencia, valor_pago, data_pagamento, status, observacoes, user_id, created_at, updated_at"
        ),
    ]);

   if (contasError || pagamentosError) {
  alert(
    JSON.stringify(
      {
        contasError: contasError?.message,
        pagamentosError: pagamentosError?.message,
      },
      null,
      2
    )
  );

  setErro("Não foi possível carregar as contas.");
  setCarregando(false);
  return;
}

    setContas((contasData as ContaFixa[]) || []);
    setPagamentos((pagamentosData as PagamentoConta[]) || []);
    setCarregando(false);
  }, [supabase]);

useEffect(() => {
  void carregarPagina();
}, [carregarPagina]);

  function limparFormulario() {
    setDescricao("");
    setValor("");
    setDiaVencimento("");
    setCategoria("");
    setObservacoes("");
    setAtiva(true);
    setTipoRecorrencia("indeterminada");
    setInicioCobranca("");
    setPrazoModo("quantidade");
    setQuantidadeMeses("");
    setFimCobranca("");
    setEditandoId(null);
    setErro("");
  }

  function limparFiltros() {
    setBusca("");
    setFiltroCategoria("todas");
  }

  function abrirNovaConta() {
    limparFormulario();
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setErro("");
  }

  function preencherFormulario(conta: ContaFixa) {
    setDescricao(conta.descricao);
    setValor(String(conta.valor));
    setDiaVencimento(String(conta.dia_vencimento));
    setCategoria(conta.categoria || "");
    setObservacoes(conta.observacoes || "");
    setAtiva(conta.ativa);
    setTipoRecorrencia(conta.tipo_recorrencia || "indeterminada");
    setInicioCobranca(conta.inicio_cobranca || "");
    setQuantidadeMeses(
      conta.quantidade_meses ? String(conta.quantidade_meses) : ""
    );
    setFimCobranca(conta.fim_cobranca || "");
    setPrazoModo(conta.fim_cobranca ? "fim" : "quantidade");
    setEditandoId(conta.id);
    setErro("");
    setModalAberto(true);
  }

  function handleTrocaTipoRecorrencia(tipo: TipoRecorrencia) {
    setTipoRecorrencia(tipo);

    if (tipo === "indeterminada") {
      setQuantidadeMeses("");
      setFimCobranca("");
      setPrazoModo("quantidade");
    }
  }

  function handleTrocaPrazoModo(modo: PrazoModo) {
    setPrazoModo(modo);

    if (modo === "quantidade") {
      setFimCobranca("");
    } else {
      setQuantidadeMeses("");
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!descricao.trim()) {
      setErro("Informe a descrição da conta.");
      return;
    }

    if (!valor || Number(valor) <= 0) {
      setErro("Informe um valor válido.");
      return;
    }

    if (!diaVencimento || Number(diaVencimento) < 1 || Number(diaVencimento) > 31) {
      setErro("Informe um dia de vencimento entre 1 e 31.");
      return;
    }

    if (!inicioCobranca) {
      setErro("Informe o mês de início da cobrança.");
      return;
    }

    if (tipoRecorrencia === "temporaria") {
      if (
        prazoModo === "quantidade" &&
        (!quantidadeMeses || Number(quantidadeMeses) < 1)
      ) {
        setErro("Informe a quantidade de meses da conta temporária.");
        return;
      }

      if (prazoModo === "fim" && !fimCobranca) {
        setErro("Informe o mês final da conta temporária.");
        return;
      }

      if (prazoModo === "fim" && fimCobranca < inicioCobranca) {
        setErro("O mês final não pode ser menor que o mês inicial.");
        return;
      }
    }

    setSalvando(true);
    setErro("");

    const payload = {
      descricao: descricao.trim(),
      valor: Number(valor),
      dia_vencimento: Number(diaVencimento),
      categoria: normalizarCategoria(categoria) || null,
      observacoes: observacoes.trim() || null,
      ativa,
      tipo_recorrencia: tipoRecorrencia,
      inicio_cobranca: inicioCobranca || null,
      quantidade_meses:
        tipoRecorrencia === "temporaria" && prazoModo === "quantidade"
          ? Number(quantidadeMeses)
          : null,
      fim_cobranca:
        tipoRecorrencia === "temporaria" && prazoModo === "fim"
          ? fimCobranca
          : null,
    };

    if (editandoId) {
      const { error } = await supabase
        .from("contas_fixas")
        .update(payload)
        .eq("id", editandoId);

      if (error) {
        console.error("Erro ao atualizar conta:", error);
        setErro(`Erro ao atualizar conta: ${error.message}`);
        setSalvando(false);
        return;
      }
    } else {
      const { error } = await supabase.from("contas_fixas").insert(payload);

      if (error) {
        console.error("Erro ao cadastrar conta:", error);
        setErro(`Erro ao cadastrar conta: ${error.message}`);
        setSalvando(false);
        return;
      }
    }

    await carregarPagina();
    setSalvando(false);
    fecharModal();
    limparFormulario();
  }

  async function alternarStatus(conta: ContaFixa) {
    const { error } = await supabase
      .from("contas_fixas")
      .update({ ativa: !conta.ativa })
      .eq("id", conta.id);

    if (error) {
      console.error("Erro ao alterar status:", error);
      alert(`Erro ao alterar status: ${error.message}`);
      return;
    }

    await carregarPagina();
  }

  async function excluirConta(conta: ContaFixa) {
    const confirmou = window.confirm(
      `Deseja realmente excluir a conta "${conta.descricao}"?`
    );

    if (!confirmou) return;

    const { error } = await supabase
      .from("contas_fixas")
      .delete()
      .eq("id", conta.id);

    if (error) {
      console.error("Erro ao excluir conta:", error);
      alert(`Erro ao excluir conta: ${error.message}`);
      return;
    }

    await carregarPagina();

    if (editandoId === conta.id) {
      limparFormulario();
      fecharModal();
    }
  }

  async function pagarConta(conta: ContaFixa, mesRef: string) {
    const key = `${conta.id}-${mesRef}`;

    try {
      setPagandoKey(key);

      const pagamentoExistente = pagamentos.find(
        (item) =>
          item.origem_tipo === "fixa" &&
          item.origem_id === conta.id &&
          item.mes_referencia === mesRef
      );

      if (pagamentoExistente) {
        const { data, error } = await supabase
          .from("pagamentos_contas")
          .update({
            valor_pago: Number(conta.valor),
            data_pagamento: getDataHoje(),
            status: "paga",
          })
          .eq("id", pagamentoExistente.id)
          .select()
          .single();

        if (error) {
          console.error("Erro ao atualizar pagamento:", error);
          alert(`Erro ao pagar conta: ${error.message}`);
          return;
        }

        setPagamentos((atual) =>
          atual.map((item) =>
            item.id === pagamentoExistente.id ? (data as PagamentoConta) : item
          )
        );
      } else {
        const { data, error } = await supabase
          .from("pagamentos_contas")
          .insert({
            origem_tipo: "fixa",
            origem_id: conta.id,
            mes_referencia: mesRef,
            valor_pago: Number(conta.valor),
            data_pagamento: getDataHoje(),
            status: "paga",
          })
          .select()
          .single();

        if (error) {
          console.error("Erro ao registrar pagamento:", error);
          alert(`Erro ao pagar conta: ${error.message}`);
          return;
        }

        setPagamentos((atual) => [...atual, data as PagamentoConta]);
      }
    } finally {
      setPagandoKey(null);
    }
  }

  async function desmarcarPagamentoConta(conta: ContaFixa, mesRef: string) {
    const key = `${conta.id}-${mesRef}`;

    try {
      setPagandoKey(key);

      const pagamentoExistente = pagamentos.find(
        (item) =>
          item.origem_tipo === "fixa" &&
          item.origem_id === conta.id &&
          item.mes_referencia === mesRef
      );

      if (!pagamentoExistente) {
        alert("Não foi encontrado pagamento para essa competência.");
        return;
      }

      const { data, error } = await supabase
        .from("pagamentos_contas")
        .update({
          status: "aberta",
          data_pagamento: null,
          valor_pago: 0,
        })
        .eq("id", pagamentoExistente.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao desfazer pagamento:", error);
        alert(`Erro ao desfazer pagamento: ${error.message}`);
        return;
      }

      setPagamentos((atual) =>
        atual.map((item) =>
          item.id === pagamentoExistente.id ? (data as PagamentoConta) : item
        )
      );
    } finally {
      setPagandoKey(null);
    }
  }

  const contasOrdenadas = useMemo(() => {
    return [...contas].sort(ordenarPorVencimento);
  }, [contas]);

  const contasDoMes = useMemo(() => {
    return contasOrdenadas.filter((conta) => contaExisteNoMes(conta, mesSelecionado));
  }, [contasOrdenadas, mesSelecionado]);

  const categoriasDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        contas
          .map((item) => item.categoria?.trim())
          .filter((item): item is string => Boolean(item))
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [contas]);

  const contasFiltradasBase = useMemo(() => {
    if (abaAtiva === "ativas") {
      return contasDoMes.filter((conta) => conta.ativa);
    }

    if (abaAtiva === "inativas") {
      return contasDoMes.filter((conta) => !conta.ativa);
    }

    return contasDoMes;
  }, [abaAtiva, contasDoMes]);

  const contasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return contasFiltradasBase.filter((conta) => {
      const matchBusca =
        !termo ||
        conta.descricao.toLowerCase().includes(termo) ||
        (conta.categoria || "").toLowerCase().includes(termo) ||
        (conta.observacoes || "").toLowerCase().includes(termo);

      const matchCategoria =
        filtroCategoria === "todas" || conta.categoria === filtroCategoria;

      return matchBusca && matchCategoria;
    });
  }, [contasFiltradasBase, busca, filtroCategoria]);

  const totalContasAtivasNoMes = useMemo(() => {
    return contas.filter((conta) => contaAtivaNoMes(conta, mesSelecionado)).length;
  }, [contas, mesSelecionado]);

  const totalMensalAtivo = useMemo(() => {
    return contas
      .filter((conta) => contaAtivaNoMes(conta, mesSelecionado))
      .reduce((acc, conta) => acc + Number(conta.valor), 0);
  }, [contas, mesSelecionado]);

  const totalCadastrado = contasDoMes.length;
  const totalInativas = contasDoMes.filter((conta) => !conta.ativa).length;
  const totalAtivas = contasDoMes.filter((conta) => conta.ativa).length;

  const totalTemporariasDevido = useMemo(() => {
    return contas
      .filter((conta) => conta.tipo_recorrencia === "temporaria" && conta.ativa)
      .reduce((acc, conta) => {
        const mesesRestantes = getMesesRestantes(conta, mesSelecionado);
        return acc + Number(conta.valor) * mesesRestantes;
      }, 0);
  }, [contas, mesSelecionado]);

  const totalPagamentosAdiantadosNoMes = useMemo(() => {
    return pagamentos
      .filter((pagamento) => pagamento.status === "paga")
      .filter((pagamento) => pagamento.data_pagamento?.slice(0, 7) === mesSelecionado)
      .filter((pagamento) => pagamento.mes_referencia > mesSelecionado)
      .reduce((acc, pagamento) => acc + Number(pagamento.valor_pago), 0);
  }, [pagamentos, mesSelecionado]);

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-slate-200 bg-linear-to-br from-white to-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Contas
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Gerencie contas recorrentes, temporárias e pagamentos por competência
            </p>
          </div>

          <button
            type="button"
            onClick={abrirNovaConta}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Nova conta
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block max-w-xs">
          <span className="mb-2 block text-sm font-medium text-slate-700">Mês</span>
          <input
            id="mesSelecionado"
            type="month"
            value={mesSelecionado}
            onChange={(e) => {
              setMesSelecionado(e.target.value);
              limparFiltros();
            }}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
          />
        </label>
      </div>

      {carregando ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="h-32 animate-pulse rounded-[28px] bg-slate-200" />
          <div className="h-32 animate-pulse rounded-[28px] bg-slate-200" />
          <div className="h-32 animate-pulse rounded-[28px] bg-slate-200" />
          <div className="h-32 animate-pulse rounded-[28px] bg-slate-200" />
          <div className="h-32 animate-pulse rounded-[28px] bg-slate-200" />
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <ResumoCard
            titulo="Contas ativas no mês"
            valor={totalContasAtivasNoMes}
            descricao="Ativas dentro do mês consultado"
            icon={<CreditCard className="h-4 w-4 text-slate-700" />}
          />

          <ResumoCard
            titulo="Total mensal ativo"
            valor={formatarMoeda(totalMensalAtivo)}
            descricao={`Soma das contas ativas em ${formatarMesAno(mesSelecionado)}`}
            icon={<CircleDollarSign className="h-4 w-4 text-blue-600" />}
            destaque="blue"
          />

          <ResumoCard
            titulo="Temporárias devidas"
            valor={formatarMoeda(totalTemporariasDevido)}
            descricao={`Restante a pagar desde ${formatarMesAno(mesSelecionado)}`}
            icon={<AlarmClock className="h-4 w-4 text-amber-600" />}
            destaque="amber"
          />

          <ResumoCard
            titulo="Adiantadas no mês"
            valor={formatarMoeda(totalPagamentosAdiantadosNoMes)}
            descricao="Pagas agora para competências futuras"
            icon={<CheckCircle2 className="h-4 w-4 text-sky-600" />}
            destaque="sky"
          />

          <ResumoCard
            titulo="Total no mês"
            valor={totalCadastrado}
            descricao={`${totalInativas} inativa(s)`}
            icon={<Wallet className="h-4 w-4 text-slate-700" />}
          />
        </section>
      )}

      <div className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Contas cadastradas
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Visualize, filtre e gerencie as contas do mês selecionado
              </p>
            </div>

            <div className="inline-flex w-fit rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  limparFiltros();
                  setAbaAtiva("todas");
                }}
                className={cls(
                  "rounded-2xl px-4 py-2 text-sm font-medium transition",
                  abaAtiva === "todas"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Todas ({totalCadastrado})
              </button>

              <button
                type="button"
                onClick={() => {
                  limparFiltros();
                  setAbaAtiva("ativas");
                }}
                className={cls(
                  "rounded-2xl px-4 py-2 text-sm font-medium transition",
                  abaAtiva === "ativas"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Ativas ({totalAtivas})
              </button>

              <button
                type="button"
                onClick={() => {
                  limparFiltros();
                  setAbaAtiva("inativas");
                }}
                className={cls(
                  "rounded-2xl px-4 py-2 text-sm font-medium transition",
                  abaAtiva === "inativas"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Inativas ({totalInativas})
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5 md:p-6">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por descrição, categoria ou observação..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
                <SlidersHorizontal className="h-4 w-4" />
              </div>

              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
              >
                <option value="todas">Todas as categorias</option>
                {categoriasDisponiveis.map((categoriaItem) => (
                  <option key={categoriaItem} value={categoriaItem}>
                    {categoriaItem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="text-sm text-slate-600">
              Mostrando{" "}
              <span className="font-semibold text-slate-900">
                {contasFiltradas.length}
              </span>{" "}
              {contasFiltradas.length === 1 ? "conta" : "contas"}
            </div>

            <div className="flex flex-wrap gap-2">
              {busca ? (
                <span className="rounded-full bg-white px-3 py-1 text-sm text-slate-700">
                  Busca: {busca}
                </span>
              ) : null}

              {filtroCategoria !== "todas" ? (
                <span className="rounded-full bg-white px-3 py-1 text-sm text-slate-700">
                  Categoria: {filtroCategoria}
                </span>
              ) : null}

              {busca || filtroCategoria !== "todas" ? (
                <button
                  type="button"
                  className="rounded-full px-3 py-1 text-sm text-slate-600 transition hover:bg-white"
                  onClick={limparFiltros}
                >
                  Limpar filtros
                </button>
              ) : null}
            </div>
          </div>

          {carregando ? (
            <div className="space-y-3">
              <div className="h-40 animate-pulse rounded-[28px] bg-slate-200" />
              <div className="h-40 animate-pulse rounded-[28px] bg-slate-200" />
              <div className="h-40 animate-pulse rounded-[28px] bg-slate-200" />
            </div>
          ) : contasFiltradas.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <Wallet className="h-6 w-6 text-slate-400" />
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-800">
                Nenhuma conta encontrada
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Não encontramos contas com os filtros atuais. Tente limpar a busca
                ou selecionar outra categoria.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {contasFiltradas.map((conta) => {
                const pagamentoMes = pagamentos.find(
                  (item) =>
                    item.origem_tipo === "fixa" &&
                    item.origem_id === conta.id &&
                    item.mes_referencia === mesSelecionado &&
                    item.status === "paga"
                );

                const estaPagando = pagandoKey === `${conta.id}-${mesSelecionado}`;

                return (
                  <ContaCard
                    key={conta.id}
                    conta={conta}
                    mesSelecionado={mesSelecionado}
                    pagamentoMes={pagamentoMes}
                    estaPagando={estaPagando}
                    onEditar={() => preencherFormulario(conta)}
                    onPagar={() => pagarConta(conta, mesSelecionado)}
                    onDesfazerPagamento={() =>
                      desmarcarPagamentoConta(conta, mesSelecionado)
                    }
                    onAlternarStatus={() => alternarStatus(conta)}
                    onExcluir={() => excluirConta(conta)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {modalAberto ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
            onClick={fecharModal}
          />

          <div className="absolute right-0 top-0 h-full w-full max-w-3xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b bg-white px-6 py-5 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {editandoId ? "Editar conta" : "Nova conta"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Cadastre uma conta recorrente ou temporária.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fecharModal}
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8">
              <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Tipo da conta</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Escolha se a cobrança será contínua ou com prazo definido.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleTrocaTipoRecorrencia("indeterminada")}
                    className={cls(
                      "rounded-2xl border p-4 text-left transition",
                      tipoRecorrencia === "indeterminada"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                    )}
                  >
                    <p className="font-medium">Recorrente</p>
                    <p
                      className={cls(
                        "mt-1 text-sm",
                        tipoRecorrencia === "indeterminada"
                          ? "text-slate-200"
                          : "text-slate-500"
                      )}
                    >
                      Sem data final definida.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTrocaTipoRecorrencia("temporaria")}
                    className={cls(
                      "rounded-2xl border p-4 text-left transition",
                      tipoRecorrencia === "temporaria"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                    )}
                  >
                    <p className="font-medium">Temporária</p>
                    <p
                      className={cls(
                        "mt-1 text-sm",
                        tipoRecorrencia === "temporaria"
                          ? "text-slate-200"
                          : "text-slate-500"
                      )}
                    >
                      Com prazo por quantidade ou mês final.
                    </p>
                  </button>
                </div>
              </section>

              <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Dados principais
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Descrição</label>
                  <input
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Aluguel"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Valor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Dia do vencimento
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={diaVencimento}
                      onChange={(e) => setDiaVencimento(e.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Mês de início
                    </label>
                    <input
                      type="month"
                      value={inicioCobranca}
                      onChange={(e) => setInicioCobranca(e.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Categoria
                    </label>
                    <input
                      list="categorias-contas"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      placeholder="Ex: Moradia"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                    />
                    <datalist id="categorias-contas">
                      {categoriasDisponiveis.map((item) => (
                        <option key={item} value={item} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </section>

              {tipoRecorrencia === "temporaria" ? (
                <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Prazo da conta temporária
                  </h3>

                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleTrocaPrazoModo("quantidade")}
                      className={cls(
                        "rounded-2xl border p-4 text-left transition",
                        prazoModo === "quantidade"
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                      )}
                    >
                      <p className="font-medium">Quantidade de meses</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTrocaPrazoModo("fim")}
                      className={cls(
                        "rounded-2xl border p-4 text-left transition",
                        prazoModo === "fim"
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                      )}
                    >
                      <p className="font-medium">Mês final</p>
                    </button>
                  </div>

                  {prazoModo === "quantidade" ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Quantidade de meses
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={quantidadeMeses}
                        onChange={(e) => setQuantidadeMeses(e.target.value)}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Mês final
                      </label>
                      <input
                        type="month"
                        value={fimCobranca}
                        onChange={(e) => setFimCobranca(e.target.value)}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                      />
                    </div>
                  )}
                </section>
              ) : null}

              <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Informações adicionais
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Observações
                  </label>
                  <input
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Opcional"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <input
                    type="checkbox"
                    checked={ativa}
                    onChange={(e) => setAtiva(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-slate-700">Conta ativa</span>
                </label>
              </section>

              {erro ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {erro}
                </div>
              ) : null}

              <div className="sticky bottom-0 flex gap-3 border-t bg-white py-4">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}