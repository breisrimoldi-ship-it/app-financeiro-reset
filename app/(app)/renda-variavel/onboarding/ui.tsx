"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, User, Settings2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { salvarPerfil } from "../perfis/actions";
import { salvarConfiguracoes } from "../configuracoes/actions";

type Step = "welcome" | "perfil" | "config" | "done";

export default function OnboardingClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("welcome");
  const [erro, setErro] = useState("");

  // Perfil fields
  const [perfilNome, setPerfilNome] = useState("");
  const [perfilDescricao, setPerfilDescricao] = useState("");

  // Config fields
  const [horasPadrao, setHorasPadrao] = useState("");
  const [metaMensal, setMetaMensal] = useState("");
  const [moeda, setMoeda] = useState("BRL");

  function handleCriarPerfil() {
    if (!perfilNome.trim()) {
      setErro("Informe o nome do perfil.");
      return;
    }

    startTransition(async () => {
      try {
        setErro("");
        await salvarPerfil({
          nome: perfilNome.trim(),
          descricao: perfilDescricao.trim(),
        });
        setStep("config");
      } catch (error) {
        setErro(
          error instanceof Error ? error.message : "Erro ao criar perfil."
        );
      }
    });
  }

  function handleSalvarConfig() {
    startTransition(async () => {
      try {
        setErro("");
        await salvarConfiguracoes({
          perfilPadraoId: null,
          horasPadrao,
          metaMensal: metaMensal ? Number(metaMensal) : null,
          moeda,
        });
        setStep("done");
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao salvar configurações."
        );
      }
    });
  }

  function handleIrParaModulo() {
    router.push("/renda-variavel");
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12 md:px-6">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {(["welcome", "perfil", "config", "done"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition ${
                i <=
                ["welcome", "perfil", "config", "done"].indexOf(step)
                  ? "bg-emerald-500"
                  : "bg-zinc-200"
              }`}
            />
          ))}
        </div>

        {erro ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        ) : null}

        {/* Step: Welcome */}
        {step === "welcome" ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <Sparkles className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Bem-vindo ao módulo de Renda Variável
              </h1>
              <p className="mt-3 max-w-md text-sm text-zinc-500">
                Aqui você poderá registrar seus lançamentos, acompanhar lucros e
                custos, e ter uma visão clara da sua atividade financeira.
              </p>
              <p className="mt-2 max-w-md text-sm text-zinc-500">
                Vamos começar com uma configuração rápida em dois passos.
              </p>
              <button
                type="button"
                onClick={() => setStep("perfil")}
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Começar
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        ) : null}

        {/* Step: Create Profile */}
        {step === "perfil" ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">
                  Crie seu primeiro perfil
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Um perfil representa uma atividade ou área de atuação (ex.:
                  Motorista, Confeitaria, Freelancer).
                </p>
              </div>
            </div>

            <div className="grid gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Nome do perfil
                </label>
                <input
                  type="text"
                  value={perfilNome}
                  onChange={(e) => setPerfilNome(e.target.value)}
                  placeholder="Ex.: Motorista"
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">
                  Descrição{" "}
                  <span className="font-normal text-zinc-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={perfilDescricao}
                  onChange={(e) => setPerfilDescricao(e.target.value)}
                  placeholder="Ex.: Atividade como motorista de aplicativo"
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setErro("");
                  setStep("welcome");
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
              <button
                type="button"
                onClick={handleCriarPerfil}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Criando..." : "Criar perfil"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        ) : null}

        {/* Step: Preferences */}
        {step === "config" ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-2xl bg-zinc-100 p-2 text-zinc-700">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">
                  Preferências iniciais
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Defina valores padrão para agilizar seus lançamentos. Você
                  pode alterar essas configurações depois.
                </p>
              </div>
            </div>

            <div className="grid gap-5">
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
                  Pré-preenche o campo de horas nos novos lançamentos.
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
                  Referência para acompanhamento do ritmo mensal.
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

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setErro("");
                  setStep("perfil");
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("done")}
                  className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
                >
                  Pular
                </button>
                <button
                  type="button"
                  onClick={handleSalvarConfig}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Salvando..." : "Salvar e continuar"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {/* Step: Done */}
        {step === "done" ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-emerald-50 p-3 text-emerald-600">
                <Check className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Tudo pronto!
              </h2>
              <p className="mt-3 max-w-md text-sm text-zinc-500">
                Seu módulo de renda variável está configurado. Agora você pode
                criar seu primeiro lançamento.
              </p>
              <button
                type="button"
                onClick={handleIrParaModulo}
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                <Sparkles className="h-4 w-4" />
                Criar primeiro lançamento
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
