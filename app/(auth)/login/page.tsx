"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<AuthMode>("login");

  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const nomeCompleto = `${nome.trim()} ${sobrenome.trim()}`.trim();

  function limparMensagens() {
    setErro(null);
    setSucesso(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      limparMensagens();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        setErro("E-mail ou senha inválidos.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErro("Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      limparMensagens();

      if (!nome.trim()) {
        setErro("Informe seu nome.");
        return;
      }

      if (!sobrenome.trim()) {
        setErro("Informe seu sobrenome.");
        return;
      }

      if (senha.length < 6) {
        setErro("A senha deve ter pelo menos 6 caracteres.");
        return;
      }

      if (senha !== confirmarSenha) {
        setErro("As senhas não coincidem.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: {
          data: {
            nome: nome.trim(),
            sobrenome: sobrenome.trim(),
            nome_completo: nomeCompleto,
          },
        },
      });

      if (error) {
        setErro(error.message || "Não foi possível criar a conta.");
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setSucesso("Conta criada com sucesso.");
      setMode("login");
      setSenha("");
      setConfirmarSenha("");
    } catch {
      setErro("Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  const submitHandler = mode === "login" ? handleLogin : handleSignup;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            AuriaFin
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {mode === "login"
              ? "Acesse sua conta para continuar no app."
              : "Crie sua conta para começar a usar o app."}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              limparMensagens();
            }}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              mode === "login"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Entrar
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
              limparMensagens();
            }}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              mode === "signup"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Criar conta
          </button>
        </div>

        {erro ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {erro}
          </div>
        ) : null}

        {sucesso ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {sucesso}
          </div>
        ) : null}

        <form onSubmit={submitHandler} className="space-y-4">
          {mode === "signup" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Nome
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required={mode === "signup"}
                  placeholder="Seu nome"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Sobrenome
                </label>
                <input
                  type="text"
                  value={sobrenome}
                  onChange={(e) => setSobrenome(e.target.value)}
                  required={mode === "signup"}
                  placeholder="Seu sobrenome"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-400"
                />
              </div>
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seuemail@exemplo.com"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              placeholder="********"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-400"
            />
          </div>

          {mode === "signup" ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Confirmar senha
              </label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required={mode === "signup"}
                placeholder="********"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-400"
              />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? mode === "login"
                ? "Entrando..."
                : "Criando conta..."
              : mode === "login"
              ? "Entrar"
              : "Criar conta"}
          </button>
        </form>
      </div>
    </main>
  );
}