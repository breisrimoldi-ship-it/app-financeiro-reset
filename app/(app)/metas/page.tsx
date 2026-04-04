"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Plus,
  Search,
  Target,
  TrendingUp,
  Wallet,
  X,
  Pencil,
  Trash2,
  PauseCircle,
  CheckCircle2,
  History,
} from "lucide-react";
import { getHojeISO } from "@/lib/finance/date";
import { formatarMoedaBRL, normalizarNumero } from "@/lib/finance/format";

const supabase = createClient();

type MetaStatus = "ativa" | "pausada" | "concluida" | "cancelada";
type MetaPrioridade = 1 | 2 | 3;
type MetaAporteTipo = "aporte" | "retirada" | "ajuste";

type MetaRow = {
  id: string;
  user_id: string;
  nome: string;
  descricao: string | null;
  tipo: string | null;
  valor_meta: number | string;
  valor_inicial: number | string;
  valor_atual: number | string | null;
  cor: string | null;
  icone: string | null;
  prazo: string | null;
  prioridade: number;
  status: MetaStatus;
  considerar_na_dashboard: boolean;
  created_at: string;
  updated_at: string;
};

type MetaAporteRow = {
  id: string;
  user_id: string;
  meta_id: string;
  tipo: MetaAporteTipo;
  valor: number | string;
  descricao: string | null;
  data: string;
  created_at: string;
};

type MetaCalculada = MetaRow & {
  valorMetaNumero: number;
  valorInicialNumero: number;
  valorAtualCalculado: number;
  faltante: number;
  percentual: number;
  aportesDaMeta: MetaAporteRow[];
  prazoFormatado: string;
  prioridadeLabel: string;
    totalAportado: number;
  mediaMensalAportes: number;
  mesesRestantes: number | null;
  valorIdealMensal: number | null;
  previsaoConclusaoTexto: string;
};

type MetaFormState = {
  nome: string;
  descricao: string;
  tipo: string;
  valorMeta: string;
  valorInicial: string;
  prazo: string;
  prioridade: MetaPrioridade;
  status: MetaStatus;
  considerarNaDashboard: boolean;
};

type AporteFormState = {
  tipo: MetaAporteTipo;
  valor: string;
  descricao: string;
  data: string;
};

const getHoje = getHojeISO;
const formatarMoeda = formatarMoedaBRL

function diferencaMesesEntreDatas(inicio: Date, fim: Date) {
  const anos = fim.getFullYear() - inicio.getFullYear();
  const meses = fim.getMonth() - inicio.getMonth();
  const total = anos * 12 + meses;

  return total < 0 ? 0 : total;
}

function somarAportesValidos(aportes: MetaAporteRow[]) {
  return aportes.reduce((acc, item) => {
    const valor = normalizarNumero(item.valor);

    if (item.tipo === "aporte") return acc + valor;
    if (item.tipo === "retirada") return acc - valor;
    if (item.tipo === "ajuste") return acc + valor;

    return acc;
  }, 0);
}

function getMediaMensalAportes(aportes: MetaAporteRow[]) {
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

function getPrevisaoConclusaoTexto(
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

function formatarData(data: string | null | undefined) {
  if (!data) return "Sem prazo";
  const [ano, mes, dia] = data.split("-");
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
}

function getStatusLabel(status: MetaStatus) {
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

function getPrioridadeLabel(prioridade: number) {
  if (prioridade === 1) return "Alta";
  if (prioridade === 2) return "Média";
  return "Baixa";
}

function getPercentual(valorAtual: number, valorMeta: number) {
  if (valorMeta <= 0) return 0;
  return Math.max(0, Math.min((valorAtual / valorMeta) * 100, 100));
}

function getMetaFormInicial(): MetaFormState {
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

function getAporteFormInicial(): AporteFormState {
  return {
    tipo: "aporte",
    valor: "",
    descricao: "",
    data: getHoje(),
  };
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function calcularValorAtual(meta: MetaRow, aportes: MetaAporteRow[]) {
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

function ResumoCard({
  titulo,
  valor,
  subtitulo,
  icon,
  tone = "default",
}: {
  titulo: string;
  valor: string;
  subtitulo: string;
  icon: React.ReactNode;
  tone?: "default" | "emerald" | "blue" | "orange";
}) {
  const toneClasses =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50/70"
      : tone === "blue"
      ? "border-blue-200 bg-blue-50/70"
      : tone === "orange"
      ? "border-orange-200 bg-orange-50/70"
      : "border-slate-200 bg-white";

  return (
    <div
      className={classNames(
        "rounded-[28px] border px-5 py-5 shadow-sm md:px-6",
        toneClasses
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            {titulo}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {valor}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitulo}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-slate-600 ring-1 ring-black/5">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  maxWidth = "max-w-2xl",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
        <div
          className={classNames(
            "flex max-h-[90vh] w-full flex-col overflow-hidden rounded-4x1 border border-slate-200 bg-white shadow-2xl",
            maxWidth
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
              {subtitle ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        </div>
      </div>
    </>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={classNames(
        "h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400",
        props.className
      )}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={classNames(
        "min-h-27.5 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400",
        props.className
      )}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={classNames(
        "h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400",
        props.className
      )}
    />
  );
}

export default function MetasPage() {
  const [userId, setUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingAporte, setSavingAporte] = useState(false);

  const [metas, setMetas] = useState<MetaRow[]>([]);
  const [aportes, setAportes] = useState<MetaAporteRow[]>([]);

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"todas" | MetaStatus>("todas");
  const [ordenacao, setOrdenacao] = useState<
    "prioridade" | "prazo" | "mais_proximo" | "maior_percentual" | "menor_faltante"
  >("prioridade");

  const [erro, setErro] = useState<string | null>(null);

  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const [metaEmEdicao, setMetaEmEdicao] = useState<MetaRow | null>(null);
  const [metaForm, setMetaForm] = useState<MetaFormState>(getMetaFormInicial());

  const [aporteModalOpen, setAporteModalOpen] = useState(false);
  const [metaAporteAtual, setMetaAporteAtual] = useState<MetaCalculada | null>(null);
  const [aporteForm, setAporteForm] = useState<AporteFormState>(getAporteFormInicial());

  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);
  const [metaHistoricoAtual, setMetaHistoricoAtual] = useState<MetaCalculada | null>(
    null
  );
  // 🔥 V12 - edição de aporte
const [aporteEditando, setAporteEditando] = useState<MetaAporteRow | null>(null);
const [valorEditando, setValorEditando] = useState("");
const [aporteInteligenteModalOpen, setAporteInteligenteModalOpen] = useState(false);
const [metaInteligenteSelecionadaId, setMetaInteligenteSelecionadaId] = useState("");
const [valorAporteInteligente, setValorAporteInteligente] = useState("");
const [savingAporteInteligente, setSavingAporteInteligente] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setUserId(null);
        setMetas([]);
        setAportes([]);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const [{ data: metasData, error: metasError }, { data: aportesData, error: aportesError }] =
        await Promise.all([
          supabase
            .from("metas")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("meta_aportes")
            .select("*")
            .eq("user_id", user.id)
            .order("data", { ascending: false })
            .order("created_at", { ascending: false }),
        ]);

      if (metasError) throw metasError;
      if (aportesError) throw aportesError;

      setMetas((metasData ?? []) as MetaRow[]);
      setAportes((aportesData ?? []) as MetaAporteRow[]);
    } catch (e) {
      setErro("Não foi possível carregar suas metas agora.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const metasCalculadas = useMemo<MetaCalculada[]>(() => {
    return metas.map((meta) => {
      const aportesDaMeta = aportes.filter((item) => item.meta_id === meta.id);
      const valorAtualCalculado = calcularValorAtual(meta, aportesDaMeta);
      const valorMetaNumero = normalizarNumero(meta.valor_meta);
      const valorInicialNumero = normalizarNumero(meta.valor_inicial);
      const faltante = Math.max(valorMetaNumero - valorAtualCalculado, 0);
      const percentual = getPercentual(valorAtualCalculado, valorMetaNumero);
      const totalAportado = somarAportesValidos(aportesDaMeta);
      const mediaMensalAportes = getMediaMensalAportes(aportesDaMeta);

      const mesesRestantes = meta.prazo
        ? Math.max(
            diferencaMesesEntreDatas(new Date(), new Date(`${meta.prazo}T12:00:00`)),
            0
          ) + 1
        : null;

      const valorIdealMensal =
        mesesRestantes && mesesRestantes > 0
          ? faltante / mesesRestantes
          : null;

      return {
        ...meta,
        valorMetaNumero,
        valorInicialNumero,
        valorAtualCalculado,
        faltante,
        percentual,
        aportesDaMeta,
        prazoFormatado: formatarData(meta.prazo),
        prioridadeLabel: getPrioridadeLabel(meta.prioridade),
        totalAportado,
        mediaMensalAportes,
        mesesRestantes,
        valorIdealMensal,
        previsaoConclusaoTexto: getPrevisaoConclusaoTexto(
          faltante,
          mediaMensalAportes,
          percentual
        ),
      };
    });
  }, [metas, aportes]);

  const metasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const base = metasCalculadas.filter((meta) => {
      const matchBusca =
        !termo ||
        meta.nome.toLowerCase().includes(termo) ||
        (meta.tipo ?? "").toLowerCase().includes(termo) ||
        (meta.descricao ?? "").toLowerCase().includes(termo);

      const matchStatus = statusFiltro === "todas" || meta.status === statusFiltro;

      return matchBusca && matchStatus;
    });

    const ordenadas = [...base].sort((a, b) => {
      if (ordenacao === "prioridade") {
        if (a.prioridade !== b.prioridade) return a.prioridade - b.prioridade;

        if (a.status === "ativa" && b.status !== "ativa") return -1;
        if (a.status !== "ativa" && b.status === "ativa") return 1;

        return a.nome.localeCompare(b.nome);
      }

      if (ordenacao === "prazo") {
        if (!a.prazo && !b.prazo) return a.nome.localeCompare(b.nome);
        if (!a.prazo) return 1;
        if (!b.prazo) return -1;
        return a.prazo.localeCompare(b.prazo);
      }

      if (ordenacao === "mais_proximo") {
        return b.valorAtualCalculado - a.valorAtualCalculado;
      }

      if (ordenacao === "maior_percentual") {
        return b.percentual - a.percentual;
      }

      if (ordenacao === "menor_faltante") {
        return a.faltante - b.faltante;
      }

      return 0;
    });

    return ordenadas;
  }, [busca, metasCalculadas, ordenacao, statusFiltro]);

  const resumo = useMemo(() => {
    const metasAtivas = metasCalculadas.filter((meta) => meta.status === "ativa");
    const metasConcluidas = metasCalculadas.filter(
      (meta) => meta.status === "concluida"
    );

    const totalGuardado = metasCalculadas.reduce(
      (acc, meta) => acc + meta.valorAtualCalculado,
      0
    );

    const inicioMes = `${getHoje().slice(0, 7)}-01`;

    const aporteMes = aportes.reduce((acc, item) => {
      if (item.data < inicioMes) return acc;
      const valor = normalizarNumero(item.valor);

      if (item.tipo === "aporte") return acc + valor;
      if (item.tipo === "retirada") return acc - valor;
      if (item.tipo === "ajuste") return acc + valor;

      return acc;
    }, 0);

    const metaMaisProxima = [...metasCalculadas]
      .filter((meta) => meta.status === "ativa" && meta.faltante > 0)
      .sort((a, b) => a.faltante - b.faltante)[0];

    return {
      totalGuardado,
      metasAtivas: metasAtivas.length,
      metasConcluidas: metasConcluidas.length,
      aporteMes,
      metaMaisProxima,
    };
  }, [aportes, metasCalculadas]);

  const inteligenciaMetas = useMemo(() => {
  const metasAtivas = metasCalculadas.filter((m) => m.status === "ativa" && m.faltante > 0);

  if (metasAtivas.length === 0) return null;

  const maisProxima = [...metasAtivas].sort((a, b) => a.faltante - b.faltante)[0];

  const maisAtrasada = [...metasAtivas].sort((a, b) => a.percentual - b.percentual)[0];

  const maisUrgente = [...metasAtivas].sort((a, b) => {
    return (b.faltante / b.valorMetaNumero) - (a.faltante / a.valorMetaNumero);
  })[0];

  const valorSugerido = Math.min(
    Number(maisUrgente.faltante || 0),
    Math.max(50, Number((Number(maisUrgente.faltante || 0) * 0.1).toFixed(2)))
  );

  return {
    maisProxima,
    maisAtrasada,
    maisUrgente,
    valorSugerido,
  };
}, [metasCalculadas]);

  function abrirNovaMeta() {
    setMetaEmEdicao(null);
    setMetaForm(getMetaFormInicial());
    setMetaModalOpen(true);
  }

  function abrirEditarMeta(meta: MetaCalculada) {
    setMetaEmEdicao(meta);
    setMetaForm({
      nome: meta.nome ?? "",
      descricao: meta.descricao ?? "",
      tipo: meta.tipo ?? "",
      valorMeta: String(meta.valorMetaNumero || 0),
      valorInicial: String(meta.valorInicialNumero || 0),
      prazo: meta.prazo ?? "",
      prioridade: (meta.prioridade as MetaPrioridade) ?? 2,
      status: meta.status,
      considerarNaDashboard: meta.considerar_na_dashboard,
    });
    setMetaModalOpen(true);
  }

  function abrirAporte(meta: MetaCalculada) {
    setMetaAporteAtual(meta);
    setAporteForm(getAporteFormInicial());
    setAporteModalOpen(true);
  }

  function abrirHistorico(meta: MetaCalculada) {
    setMetaHistoricoAtual(meta);
    setHistoricoModalOpen(true);
  }

  async function salvarMeta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userId) {
      setErro("Você precisa estar logado para cadastrar metas.");
      return;
    }

    if (!metaForm.nome.trim()) {
      setErro("Informe o nome da meta.");
      return;
    }

    if (!metaForm.valorMeta || Number(metaForm.valorMeta) <= 0) {
      setErro("Informe um valor alvo válido para a meta.");
      return;
    }

    try {
      setSavingMeta(true);
      setErro(null);

      const payload = {
        user_id: userId,
        nome: metaForm.nome.trim(),
        descricao: metaForm.descricao.trim() || null,
        tipo: metaForm.tipo.trim() || null,
        valor_meta: Number(metaForm.valorMeta || 0),
        valor_inicial: Number(metaForm.valorInicial || 0),
        prazo: metaForm.prazo || null,
        prioridade: Number(metaForm.prioridade),
        status: metaForm.status,
        considerar_na_dashboard: metaForm.considerarNaDashboard,
        updated_at: new Date().toISOString(),
      };

      if (metaEmEdicao) {
        const { error } = await supabase
          .from("metas")
          .update(payload)
          .eq("id", metaEmEdicao.id)
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("metas").insert(payload);

        if (error) throw error;
      }

      setMetaModalOpen(false);
      setMetaEmEdicao(null);
      setMetaForm(getMetaFormInicial());
      await carregarDados();
    } catch (e) {
      setErro("Não foi possível salvar a meta.");
    } finally {
      setSavingMeta(false);
    }
  }

  async function excluirMeta(meta: MetaCalculada) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir a meta "${meta.nome}"?`
    );
    if (!confirmar || !userId) return;

    try {
      setErro(null);

      const { error } = await supabase
        .from("metas")
        .delete()
        .eq("id", meta.id)
        .eq("user_id", userId);

      if (error) throw error;

      await carregarDados();
    } catch (e) {
      setErro("Não foi possível excluir a meta.");
    }
  }

  async function atualizarStatus(meta: MetaCalculada, status: MetaStatus) {
    if (!userId) return;

    try {
      setErro(null);

      const { error } = await supabase
        .from("metas")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", meta.id)
        .eq("user_id", userId);

      if (error) throw error;

      await carregarDados();
    } catch (e) {
      setErro("Não foi possível atualizar o status da meta.");
    }
  }

  async function salvarAporte(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  if (!userId || !metaAporteAtual) {
    setErro("Meta inválida para lançamento.");
    return;
  }

  if (!aporteForm.valor || Number(aporteForm.valor) <= 0) {
    setErro("Informe um valor válido.");
    return;
  }

  try {
    setSavingAporte(true);
    setErro(null);

    const valorNumerico = Number(aporteForm.valor || 0);
    const dataLancamento = aporteForm.data || getHoje();

    const payloadAporte = {
      user_id: userId,
      meta_id: metaAporteAtual.id,
      tipo: aporteForm.tipo,
      valor: valorNumerico,
      descricao: aporteForm.descricao.trim() || null,
      data: dataLancamento,
    };

    const { data: aporteCriado, error: aporteError } = await supabase
      .from("meta_aportes")
      .insert(payloadAporte)
      .select()
      .single();

    if (aporteError) throw aporteError;

    const descricaoMovimentacao =
      aporteForm.descricao.trim() ||
      `${aporteForm.tipo === "retirada" ? "Retirada" : "Aporte"} - ${metaAporteAtual.nome}`;

    const categoriaMovimentacao =
      aporteForm.tipo === "retirada" ? "retirada_meta" : "aporte_meta";

    const { error: movimentacaoError } = await supabase
      .from("movimentacoes")
      .insert({
        tipo: "despesa",
        descricao: descricaoMovimentacao,
        categoria: categoriaMovimentacao,
        valor: valorNumerico,
        data: dataLancamento,
        tipo_pagamento: "pix_dinheiro",
        cartao_id: null,
        parcelas: null,
        primeira_cobranca: null,
        meta_id: metaAporteAtual.id,
        meta_aporte_id: aporteCriado.id,
      });

    if (movimentacaoError) {
      await supabase.from("meta_aportes").delete().eq("id", aporteCriado.id);
      throw movimentacaoError;
    }

    setAporteModalOpen(false);
    setMetaAporteAtual(null);
    setAporteForm(getAporteFormInicial());

    await carregarDados();
  } catch (e) {
    setErro("Não foi possível salvar o lançamento da meta.");
  } finally {
    setSavingAporte(false);
  }
}
  async function excluirAporte(item: MetaAporteRow) {
    const confirmar = window.confirm("Deseja excluir este lançamento?");
    if (!confirmar || !userId) return;

    try {
      setErro(null);

      const { error } = await supabase
        .from("meta_aportes")
        .delete()
        .eq("id", item.id)
        .eq("user_id", userId);

      if (error) throw error;

      await carregarDados();
    } catch (e) {
      setErro("Não foi possível excluir o lançamento.");
    }
  }

async function confirmarAporteInteligente() {
  if (!userId) {
    setErro("Você precisa estar logado para registrar um aporte.");
    return;
  }

  if (!metaInteligenteSelecionadaId) {
    setErro("Selecione uma meta para continuar.");
    return;
  }

  const meta = metasCalculadas.find((item) => item.id === metaInteligenteSelecionadaId);

  if (!meta) {
    setErro("Meta não encontrada.");
    return;
  }

  const valorNumerico = Number(valorAporteInteligente || 0);

  if (valorNumerico <= 0) {
    setErro("Informe um valor válido para o aporte.");
    return;
  }

  try {
    setSavingAporteInteligente(true);
    setErro(null);

    const dataLancamento = getHoje();

    const { data: aporteCriado, error: aporteError } = await supabase
      .from("meta_aportes")
      .insert({
        user_id: userId,
        meta_id: meta.id,
        tipo: "aporte",
        valor: valorNumerico,
        descricao: `Aporte inteligente - ${meta.nome}`,
        data: dataLancamento,
      })
      .select()
      .single();

    if (aporteError) throw aporteError;

    const { error: movimentacaoError } = await supabase
      .from("movimentacoes")
      .insert({
        tipo: "despesa",
        descricao: `Aporte inteligente - ${meta.nome}`,
        categoria: "aporte_meta",
        valor: valorNumerico,
        data: dataLancamento,
        tipo_pagamento: "pix_dinheiro",
        cartao_id: null,
        parcelas: null,
        primeira_cobranca: null,
        meta_id: meta.id,
        meta_aporte_id: aporteCriado.id,
      });

    if (movimentacaoError) {
      await supabase.from("meta_aportes").delete().eq("id", aporteCriado.id);
      throw movimentacaoError;
    }

    setAporteInteligenteModalOpen(false);
    setMetaInteligenteSelecionadaId("");
    setValorAporteInteligente("");

    await carregarDados();
  } catch (e) {
    setErro("Não foi possível executar o aporte inteligente.");
  } finally {
    setSavingAporteInteligente(false);
  }
}

function abrirModalAporteInteligente() {
  if (!inteligenciaMetas?.maisUrgente) {
    setErro("Nenhuma meta disponível para aporte inteligente.");
    return;
  }

  setErro(null);
  setMetaInteligenteSelecionadaId(inteligenciaMetas.maisUrgente.id);
  setValorAporteInteligente(String(inteligenciaMetas.valorSugerido));
  setAporteInteligenteModalOpen(true);
}

  const metaInteligenteSelecionada = useMemo(() => {
  if (!metaInteligenteSelecionadaId) return null;

  return metasCalculadas.find(
    (item) => item.id === metaInteligenteSelecionadaId
  ) ?? null;
}, [metaInteligenteSelecionadaId, metasCalculadas]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-4x1 border border-slate-200 bg-white px-6 py-8 shadow-sm">
          <div className="h-5 w-32 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-10 w-72 animate-pulse rounded-2xl bg-slate-200" />
          <div className="mt-3 h-4 w-80 animate-pulse rounded-full bg-slate-100" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm"
            >
              <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-4 h-8 w-32 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-3 h-4 w-40 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm"
            >
              <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-4 h-4 w-60 animate-pulse rounded-full bg-slate-100" />
              <div className="mt-6 h-3 w-full animate-pulse rounded-full bg-slate-100" />
              <div className="mt-6 h-10 w-full animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }


  if (!userId) {
    return (
      <div className="rounded-4x1 border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          Metas
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          Faça login para visualizar suas metas
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
          Assim que você entrar na sua conta, esta página poderá listar, criar e
          acompanhar suas metas financeiras.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-4x1 border border-slate-200 bg-linear-to-r from-white to-slate-50 px-6 py-8 shadow-sm md:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              <Target className="h-3.5 w-3.5" />
              Gestão de metas
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
              Metas
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
              Crie, acompanhe e organize seus objetivos financeiros com histórico
              de aportes, progresso e leitura rápida do que ainda falta.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirNovaMeta}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Nova meta
          </button>
        </div>
      </section>

      {erro ? (
        <div className="rounded-3x1 border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-sm">
          {erro}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          titulo="Total guardado"
          valor={formatarMoeda(resumo.totalGuardado)}
          subtitulo="Soma do valor atual de todas as metas."
          icon={<Wallet className="h-5 w-5" />}
          tone="emerald"
        />

        <ResumoCard
          titulo="Metas ativas"
          valor={String(resumo.metasAtivas)}
          subtitulo="Objetivos em andamento no momento."
          icon={<Target className="h-5 w-5" />}
        />

        <ResumoCard
          titulo="Aporte no mês"
          valor={formatarMoeda(resumo.aporteMes)}
          subtitulo="Entradas e ajustes do mês atual nas metas."
          icon={<TrendingUp className="h-5 w-5" />}
          tone="blue"
        />

       <ResumoCard
  titulo="Próxima meta"
  valor={
    resumo.metaMaisProxima
      ? formatarMoeda(resumo.metaMaisProxima.faltante)
      : "—"
  }
  subtitulo={
    resumo.metaMaisProxima
      ? `${resumo.metaMaisProxima.nome} é a mais próxima de concluir.`
      : "Nenhuma meta ativa pendente no momento."
  }
  icon={<CalendarDays className="h-5 w-5" />}
  tone="orange"
/>
      </section>

{inteligenciaMetas && (
  <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
        Inteligência
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
        Prioridade entre metas
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        O app destaca automaticamente qual meta merece mais atenção agora.
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-3">

      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-rose-600">
          Mais urgente
        </p>
        <p className="mt-2 text-base font-semibold text-slate-900">
          {inteligenciaMetas.maisUrgente.nome}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Falta {formatarMoeda(inteligenciaMetas.maisUrgente.faltante)}
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-600">
          Mais próxima
        </p>
        <p className="mt-2 text-base font-semibold text-slate-900">
          {inteligenciaMetas.maisProxima.nome}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Falta {formatarMoeda(inteligenciaMetas.maisProxima.faltante)}
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-amber-600">
          Mais atrasada
        </p>
        <p className="mt-2 text-base font-semibold text-slate-900">
          {inteligenciaMetas.maisAtrasada.nome}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {inteligenciaMetas.maisAtrasada.percentual.toFixed(0)}% concluída
        </p>
      </div>

        </div>

    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
      <div>
        <p className="text-sm font-medium text-slate-900">
          Sugestão de aporte agora
        </p>
        <p className="text-sm text-slate-500">
          {inteligenciaMetas.maisUrgente.nome} • {formatarMoeda(inteligenciaMetas.valorSugerido)}
        </p>
      </div>

      <button
        type="button"
        onClick={abrirModalAporteInteligente}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        <Plus className="h-4 w-4" />
        Aportar agora
      </button>
    </div>
  </section>
)}

      <section className="rounded-4x1border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-4 border-b border-slate-200 px-6 py-5 xl:grid-cols-[1.3fr_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, tipo ou descrição..."
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-slate-400"
            />
          </div>

          <Select
            value={statusFiltro}
            onChange={(e) =>
              setStatusFiltro(e.target.value as "todas" | MetaStatus)
            }
          >
            <option value="todas">Todas as metas</option>
            <option value="ativa">Ativas</option>
            <option value="pausada">Pausadas</option>
            <option value="concluida">Concluídas</option>
            <option value="cancelada">Canceladas</option>
          </Select>

          <Select
            value={ordenacao}
            onChange={(e) =>
              setOrdenacao(
                e.target.value as
                  | "prioridade"
                  | "prazo"
                  | "mais_proximo"
                  | "maior_percentual"
                  | "menor_faltante"
              )
            }
          >
            <option value="prioridade">Ordenar por prioridade</option>
            <option value="prazo">Ordenar por prazo</option>
            <option value="mais_proximo">Mais próximas</option>
            <option value="maior_percentual">Maior progresso</option>
            <option value="menor_faltante">Menor valor faltante</option>
          </Select>
        </div>

        <div className="p-6">
          {metasFiltradas.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <p className="text-lg font-semibold text-slate-900">
                Nenhuma meta encontrada
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Crie sua primeira meta ou ajuste os filtros para visualizar os
                resultados.
              </p>

              <button
                type="button"
                onClick={abrirNovaMeta}
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Criar meta
              </button>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {metasFiltradas.map((meta) => {
                const statusClasses =
                  meta.status === "ativa"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : meta.status === "pausada"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : meta.status === "concluida"
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-slate-50 text-slate-600";

                return (
                  <div
                    key={meta.id}
                    className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6"
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                              {meta.nome}
                            </h3>

                            <span
                              className={classNames(
                                "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                                statusClasses
                              )}
                            >
                              {getStatusLabel(meta.status)}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {meta.tipo ? (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                {meta.tipo}
                              </span>
                            ) : null}

                            <span className="rounded-full bg-slate-100 px-2.5 py-1">
                              Prioridade {meta.prioridadeLabel}
                            </span>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1">
                              {meta.prazoFormatado}
                            </span>

                            {meta.considerar_na_dashboard ? (
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                                Na dashboard
                              </span>
                            ) : null}
                          </div>

                          {meta.descricao ? (
                            <p className="mt-3 text-sm leading-relaxed text-slate-500">
                              {meta.descricao}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => abrirAporte(meta)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                          >
                            <Plus className="h-4 w-4" />
                            Aportar
                          </button>

                          <button
                            type="button"
                            onClick={() => abrirHistorico(meta)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            <History className="h-4 w-4" />
                            Histórico
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                            Guardado
                          </p>
                          <p className="mt-2 text-xl font-semibold text-slate-900">
                            {formatarMoeda(meta.valorAtualCalculado)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                            Meta
                          </p>
                          <p className="mt-2 text-xl font-semibold text-slate-900">
                            {formatarMoeda(meta.valorMetaNumero)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                            Falta
                          </p>
                          <p className="mt-2 text-xl font-semibold text-slate-900">
                            {formatarMoeda(meta.faltante)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <p className="text-sm font-medium text-slate-700">
                            Progresso
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            {meta.percentual.toFixed(0)}%
                          </p>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-900 transition-all"
                            style={{ width: `${meta.percentual}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                            Ritmo atual
                          </p>
                          <p className="mt-2 text-base font-semibold text-slate-900">
                            {formatarMoeda(meta.mediaMensalAportes)}/mês
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Média com base no histórico de aportes
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                            Previsão
                          </p>
                          <p className="mt-2 text-base font-semibold text-slate-900">
                            {meta.previsaoConclusaoTexto}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Estimativa com base no seu ritmo atual
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                            Ideal por mês
                          </p>
                          <p className="mt-2 text-base font-semibold text-slate-900">
                            {meta.valorIdealMensal !== null
                              ? `${formatarMoeda(meta.valorIdealMensal)}/mês`
                              : "Sem prazo"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Para cumprir a meta até o prazo
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                        <button
                          type="button"
                          onClick={() => abrirEditarMeta(meta)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>

                        {meta.status !== "pausada" ? (
                          <button
                            type="button"
                            onClick={() => atualizarStatus(meta, "pausada")}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
                          >
                            <PauseCircle className="h-4 w-4" />
                            Pausar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => atualizarStatus(meta, "ativa")}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                            Reativar
                          </button>
                        )}

                        {meta.status !== "concluida" ? (
                          <button
                            type="button"
                            onClick={() => atualizarStatus(meta, "concluida")}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Concluir
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => excluirMeta(meta)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {metaModalOpen ? (
        <ModalShell
          title={metaEmEdicao ? "Editar meta" : "Nova meta"}
          subtitle="Preencha as informações principais da meta. O valor atual será calculado com base no valor inicial e nos lançamentos registrados."
          onClose={() => {
            setMetaModalOpen(false);
            setMetaEmEdicao(null);
            setMetaForm(getMetaFormInicial());
          }}
        >
          <form onSubmit={salvarMeta} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Campo label="Nome da meta">
                <Input
                  value={metaForm.nome}
                  onChange={(e) =>
                    setMetaForm((prev) => ({ ...prev, nome: e.target.value }))
                  }
                  placeholder="Ex.: Impressora 3D"
                />
              </Campo>

              <Campo label="Tipo">
                <Input
                  value={metaForm.tipo}
                  onChange={(e) =>
                    setMetaForm((prev) => ({ ...prev, tipo: e.target.value }))
                  }
                  placeholder="Ex.: Equipamento, viagem, reserva..."
                />
              </Campo>
            </div>

            <Campo label="Descrição">
              <Textarea
                value={metaForm.descricao}
                onChange={(e) =>
                  setMetaForm((prev) => ({
                    ...prev,
                    descricao: e.target.value,
                  }))
                }
                placeholder="Detalhes opcionais sobre essa meta..."
              />
            </Campo>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <Campo label="Valor alvo">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={metaForm.valorMeta}
                  onChange={(e) =>
                    setMetaForm((prev) => ({
                      ...prev,
                      valorMeta: e.target.value,
                    }))
                  }
                  placeholder="0,00"
                />
              </Campo>

              <Campo label="Valor inicial">
                <Input
                  type="number"
                  step="0.01"
                  value={metaForm.valorInicial}
                  onChange={(e) =>
                    setMetaForm((prev) => ({
                      ...prev,
                      valorInicial: e.target.value,
                    }))
                  }
                  placeholder="0,00"
                />
              </Campo>

              <Campo label="Prazo">
                <Input
                  type="date"
                  value={metaForm.prazo}
                  onChange={(e) =>
                    setMetaForm((prev) => ({ ...prev, prazo: e.target.value }))
                  }
                />
              </Campo>

              <Campo label="Prioridade">
                <Select
                  value={String(metaForm.prioridade)}
                  onChange={(e) =>
                    setMetaForm((prev) => ({
                      ...prev,
                      prioridade: Number(e.target.value) as MetaPrioridade,
                    }))
                  }
                >
                  <option value="1">Alta</option>
                  <option value="2">Média</option>
                  <option value="3">Baixa</option>
                </Select>
              </Campo>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Campo label="Status">
                <Select
                  value={metaForm.status}
                  onChange={(e) =>
                    setMetaForm((prev) => ({
                      ...prev,
                      status: e.target.value as MetaStatus,
                    }))
                  }
                >
                  <option value="ativa">Ativa</option>
                  <option value="pausada">Pausada</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                </Select>
              </Campo>

              <Campo label="Exibir na dashboard">
                <div className="flex h-12 items-center rounded-2xl border border-slate-300 px-4">
                  <input
                    id="considerar_na_dashboard"
                    type="checkbox"
                    checked={metaForm.considerarNaDashboard}
                    onChange={(e) =>
                      setMetaForm((prev) => ({
                        ...prev,
                        considerarNaDashboard: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <label
                    htmlFor="considerar_na_dashboard"
                    className="ml-3 text-sm text-slate-700"
                  >
                    Mostrar essa meta no resumo da dashboard
                  </label>
                </div>
              </Campo>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={() => {
                  setMetaModalOpen(false);
                  setMetaEmEdicao(null);
                  setMetaForm(getMetaFormInicial());
                }}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={savingMeta}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingMeta
                  ? "Salvando..."
                  : metaEmEdicao
                  ? "Salvar alterações"
                  : "Criar meta"}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {aporteModalOpen && metaAporteAtual ? (
        <ModalShell
          title={`Novo lançamento • ${metaAporteAtual.nome}`}
          subtitle="Registre um aporte, retirada ou ajuste para atualizar o progresso da meta."
          onClose={() => {
            setAporteModalOpen(false);
            setMetaAporteAtual(null);
            setAporteForm(getAporteFormInicial());
          }}
          maxWidth="max-w-xl"
        >
          <form onSubmit={salvarAporte} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Campo label="Tipo">
                <Select
                  value={aporteForm.tipo}
                  onChange={(e) =>
                    setAporteForm((prev) => ({
                      ...prev,
                      tipo: e.target.value as MetaAporteTipo,
                    }))
                  }
                >
                  <option value="aporte">Aporte</option>
                  <option value="retirada">Retirada</option>
                  <option value="ajuste">Ajuste</option>
                </Select>
              </Campo>

              <Campo label="Data">
                <Input
                  type="date"
                  value={aporteForm.data}
                  onChange={(e) =>
                    setAporteForm((prev) => ({
                      ...prev,
                      data: e.target.value,
                    }))
                  }
                />
              </Campo>
            </div>

            <Campo label="Valor">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={aporteForm.valor}
                onChange={(e) =>
                  setAporteForm((prev) => ({
                    ...prev,
                    valor: e.target.value,
                  }))
                }
                placeholder="0,00"
              />
            </Campo>

            <Campo label="Descrição">
              <Textarea
                value={aporteForm.descricao}
                onChange={(e) =>
                  setAporteForm((prev) => ({
                    ...prev,
                    descricao: e.target.value,
                  }))
                }
                placeholder="Ex.: aporte mensal, retirada emergencial, ajuste manual..."
              />
            </Campo>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={() => {
                  setAporteModalOpen(false);
                  setMetaAporteAtual(null);
                  setAporteForm(getAporteFormInicial());
                }}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={savingAporte}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingAporte ? "Salvando..." : "Salvar lançamento"}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {historicoModalOpen && metaHistoricoAtual ? (
        <ModalShell
          title={`Histórico • ${metaHistoricoAtual.nome}`}
          subtitle="Aqui você acompanha todos os lançamentos registrados para essa meta."
          onClose={() => {
            setHistoricoModalOpen(false);
            setMetaHistoricoAtual(null);
          }}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Guardado
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {formatarMoeda(metaHistoricoAtual.valorAtualCalculado)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Meta
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {formatarMoeda(metaHistoricoAtual.valorMetaNumero)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Faltante
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {formatarMoeda(metaHistoricoAtual.faltante)}
                </p>
              </div>
            </div>

            {metaHistoricoAtual.aportesDaMeta.length === 0 ? (
              <div className="rounded-3x1 border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                <p className="text-base font-semibold text-slate-900">
                  Ainda não há lançamentos nesta meta
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Registre aportes, retiradas ou ajustes para acompanhar a evolução.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {metaHistoricoAtual.aportesDaMeta.map((item) => {
                  const isAporte = item.tipo === "aporte";
                  const isRetirada = item.tipo === "retirada";

                  return (
                    <div
  key={item.id}
  onClick={() => {
    setAporteEditando(item);
    setValorEditando(String(item.valor));
  }}
  className="rounded-3x1 border border-slate-200 bg-white px-5 py-4 shadow-sm cursor-pointer hover:bg-slate-50"
>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={classNames(
                                "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                isAporte
                                  ? "bg-emerald-50 text-emerald-700"
                                  : isRetirada
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-blue-50 text-blue-700"
                              )}
                            >
                              {isAporte ? (
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              ) : isRetirada ? (
                                <ArrowDownLeft className="h-3.5 w-3.5" />
                              ) : (
                                <TrendingUp className="h-3.5 w-3.5" />
                              )}
                              {item.tipo}
                            </span>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                              {formatarData(item.data)}
                            </span>
                          </div>

                          {item.descricao ? (
                            <p className="mt-3 text-sm leading-relaxed text-slate-500">
                              {item.descricao}
                            </p>
                          ) : (
                            <p className="mt-3 text-sm text-slate-400">
                              Sem descrição informada.
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p
                              className={classNames(
                                "text-lg font-semibold",
                                isAporte
                                  ? "text-emerald-600"
                                  : isRetirada
                                  ? "text-rose-600"
                                  : "text-blue-600"
                              )}
                            >
                              {isRetirada ? "- " : "+ "}
                              {formatarMoeda(normalizarNumero(item.valor))}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => excluirAporte(item)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ModalShell>
      ) : null}
      {aporteEditando && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

    <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">

      <h2 className="text-lg font-semibold">Editar aporte</h2>

      <input
        value={valorEditando}
        onChange={(e) => setValorEditando(e.target.value)}
        className="w-full border rounded-xl p-3"
      />

      <div className="flex gap-2">

        <button
          onClick={async () => {
            await supabase
              .from("meta_aportes")
              .update({ valor: Number(valorEditando) })
              .eq("id", aporteEditando.id);

            setAporteEditando(null);
            carregarDados();
          }}
          className="flex-1 bg-black text-white rounded-xl p-3"
        >
          Salvar
        </button>

        <button
          onClick={async () => {
            await supabase
              .from("meta_aportes")
              .delete()
              .eq("id", aporteEditando.id);

            setAporteEditando(null);
            carregarDados();
          }}
          className="flex-1 border rounded-xl p-3"
        >
          Excluir
        </button>

      </div>
    </div>
  </div>
)}
{aporteInteligenteModalOpen && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

    <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">

      <h2 className="text-lg font-semibold">Aporte inteligente</h2>

      <select
        value={metaInteligenteSelecionadaId}
        onChange={(e) => setMetaInteligenteSelecionadaId(e.target.value)}
        className="w-full border rounded-xl p-3"
      >
        {metasCalculadas
          .filter((m) => m.status === "ativa" && m.faltante > 0)
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
      </select>

      <input
        type="number"
        value={valorAporteInteligente}
        onChange={(e) => setValorAporteInteligente(e.target.value)}
        className="w-full border rounded-xl p-3"
      />

      {metaInteligenteSelecionada && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Guardado
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {formatarMoeda(metaInteligenteSelecionada.valorAtualCalculado)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Falta
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {formatarMoeda(metaInteligenteSelecionada.faltante)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Progresso
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {metaInteligenteSelecionada.percentual.toFixed(0)}%
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              Ideal por mês
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {metaInteligenteSelecionada.valorIdealMensal !== null
                ? formatarMoeda(metaInteligenteSelecionada.valorIdealMensal)
                : "Sem prazo"}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2">

        <button
          onClick={() => {
            setAporteInteligenteModalOpen(false);
            setMetaInteligenteSelecionadaId("");
            setValorAporteInteligente("");
          }}
          className="flex-1 border rounded-xl p-3"
        >
          Cancelar
        </button>

        <button
          onClick={confirmarAporteInteligente}
            disabled={savingAporteInteligente}
            className="flex-1 bg-black text-white rounded-xl p-3 disabled:opacity-50"
        >
          Confirmar
        </button>

      </div>
    </div>
  </div>
)}
    </div>
  );
}