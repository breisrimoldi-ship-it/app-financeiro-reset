"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Settings2 } from "lucide-react";
import { salvarConfiguracoes } from "./actions";

type Perfil = {
  id: string;
  nome: string;
};

type Configuracao = {
  perfil_padrao_id: string | null;
  horas_padrao: string | null;
  meta_mensal: number | null;
  moeda: string;
};

type Props = {
  perfis: Perfil[];
  config: Configuracao | null;
};

export default function ConfiguracoesClient({ perfis, config }: Props) {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const [perfilPadraoId, setPerfilPadraoId] = useState(
    config?.perfil_padrao_id ?? ""
  );
  const [horasPadrao, setHorasPadrao] = useState(
    config?.horas_padrao ?? ""
  );
  const [metaMensal, setMetaMensal] = useState(
    config?.meta_mensal != null ? String(config.meta_mensal) : ""
  );
  const [moeda, setMoeda] = useState(config?.moeda ?? "BRL");

  function handleSalvar() {
    startTransition(async () => {
      try {
        setErro("");
        setSucesso(false);

        await salvarConfiguracoes({
          perfilPadraoId: perfilPadraoId || null,
          horasPadrao,
          metaMensal: metaMensal ? Number(metaMensal) : null,
          moeda,
        });

        setSucesso(true);
      } catch (error) {
        setErro(
          error instanceof Error ? error.message : "Erro ao salvar configurações."
        );
      }
    });
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <Link
            href="/renda-variavel"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para renda variável
          </Link>

          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
              <Settings2 className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Configurações
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Defina preferências do módulo de renda variável.
              </p>
            </div>
          </div>

          {erro ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </div>
          ) : null}

          {sucesso ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Configurações salvas com sucesso.
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-zinc-900">
              Preferências gerais
            </h2>
            <p className="text-sm text-zinc-500">
              Essas configurações são usadas como padrão nos novos lançamentos.
            </p>
          </div>

          <div className="grid gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Perfil padrão
              </label>
              <select
                value={perfilPadraoId}
                onChange={(e) => setPerfilPadraoId(e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
              >
                <option value="">Nenhum (selecionar manualmente)</option>
                {perfis.map((perfil) => (
                  <option key={perfil.id} value={perfil.id}>
                    {perfil.nome}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500">
                Perfil selecionado por padrão ao criar novos lançamentos.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Horas padrão por dia
              </label>
              <input
                type="text"
                value={horasPadrao}
                onChange={(e) => setHorasPadrao(e.target.value)}
                placeholder="Ex.: 08h00min"
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
              />
              <p className="text-xs text-zinc-500">
                Pré-preenche o campo de horas trabalhadas nos lançamentos.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Meta mensal de lucro líquido
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={metaMensal}
                onChange={(e) => setMetaMensal(e.target.value)}
                placeholder="Ex.: 8000"
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
              />
              <p className="text-xs text-zinc-500">
                Usado como referência na seção de meta e ritmo do mês.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">
                Moeda
              </label>
              <select
                value={moeda}
                onChange={(e) => setMoeda(e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
              >
                <option value="BRL">BRL — Real brasileiro</option>
                <option value="USD">USD — Dólar americano</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSalvar}
            disabled={isPending}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Salvando..." : "Salvar configurações"}
          </button>
        </section>
      </div>
    </main>
  );
}
