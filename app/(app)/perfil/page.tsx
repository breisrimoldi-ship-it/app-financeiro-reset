"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Mail,
  Save,
  Shield,
  User,
  Trash2,
  X,
} from "lucide-react";

const supabase = createClient();

type PerfilForm = {
  nome: string;
  sobrenome: string;
};

type SenhaForm = {
  novaSenha: string;
  confirmarNovaSenha: string;
};

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getNomeCompleto(nome: string, sobrenome: string) {
  return `${nome.trim()} ${sobrenome.trim()}`.trim();
}

function getInicial(nomeCompleto: string, email: string) {
  const base = nomeCompleto.trim() || email.trim() || "U";
  return base.charAt(0).toUpperCase();
}

function Card({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              {subtitle}
            </p>
          ) : null}

          <div className="mt-6">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-sm font-medium text-slate-700">
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={classNames(
        "h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500",
        props.className
      )}
    />
  );
}

function DangerModal({
  open,
  onClose,
  onConfirm,
  email,
  confirmacao,
  setConfirmacao,
  loading,
  erro,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  email: string;
  confirmacao: string;
  setConfirmacao: (value: string) => void;
  loading: boolean;
  erro: string | null;
}) {
  if (!open) return null;

  const confirmacaoValida = confirmacao.trim().toUpperCase() === "EXCLUIR";

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Excluir conta
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Essa ação é permanente. Seus dados vinculados ao app serão
                removidos e sua conta perderá o acesso.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-5 px-6 py-6">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">
              <p className="font-medium">Conta atual</p>
              <p className="mt-1 break-all">{email}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              Para confirmar, digite <span className="font-semibold">EXCLUIR</span>{" "}
              no campo abaixo.
            </div>

            <div>
              <Label>Confirmação</Label>
              <Input
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                placeholder="Digite EXCLUIR"
              />
            </div>

            {erro ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {erro}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={!confirmacaoValida || loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {loading ? "Excluindo..." : "Excluir conta"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PerfilPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [savingSenha, setSavingSenha] = useState(false);
  const [deletingConta, setDeletingConta] = useState(false);

  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState<PerfilForm>({
    nome: "",
    sobrenome: "",
  });

  const [senhaForm, setSenhaForm] = useState<SenhaForm>({
    novaSenha: "",
    confirmarNovaSenha: "",
  });

  const [erroPerfil, setErroPerfil] = useState<string | null>(null);
  const [sucessoPerfil, setSucessoPerfil] = useState<string | null>(null);

  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [sucessoSenha, setSucessoSenha] = useState<string | null>(null);

  const [modalExcluirOpen, setModalExcluirOpen] = useState(false);
  const [confirmacaoExcluir, setConfirmacaoExcluir] = useState("");
  const [erroExcluir, setErroExcluir] = useState<string | null>(null);

  const nomeCompleto = useMemo(
    () => getNomeCompleto(perfil.nome, perfil.sobrenome),
    [perfil.nome, perfil.sobrenome]
  );

  const inicial = useMemo(
    () => getInicial(nomeCompleto, email),
    [nomeCompleto, email]
  );

  useEffect(() => {
    async function carregarUsuario() {
      try {
        setLoading(true);

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;
        if (!user) return;

        setEmail(user.email ?? "");

        const nome =
          typeof user.user_metadata?.nome === "string"
            ? user.user_metadata.nome
            : "";

        const sobrenome =
          typeof user.user_metadata?.sobrenome === "string"
            ? user.user_metadata.sobrenome
            : "";

        setPerfil({
          nome,
          sobrenome,
        });
      } catch {
        setErroPerfil("Não foi possível carregar os dados do perfil.");
      } finally {
        setLoading(false);
      }
    }

    carregarUsuario();
  }, []);

  async function handleSalvarPerfil(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSavingPerfil(true);
      setErroPerfil(null);
      setSucessoPerfil(null);

      if (!perfil.nome.trim()) {
        setErroPerfil("Informe seu nome.");
        return;
      }

      if (!perfil.sobrenome.trim()) {
        setErroPerfil("Informe seu sobrenome.");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          nome: perfil.nome.trim(),
          sobrenome: perfil.sobrenome.trim(),
          nome_completo: nomeCompleto,
        },
      });

      if (error) {
        setErroPerfil("Não foi possível salvar seus dados.");
        return;
      }

      setSucessoPerfil("Perfil atualizado com sucesso.");
      router.refresh();
    } catch {
      setErroPerfil("Erro ao atualizar perfil.");
    } finally {
      setSavingPerfil(false);
    }
  }

  async function handleSalvarSenha(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSavingSenha(true);
      setErroSenha(null);
      setSucessoSenha(null);

      if (!senhaForm.novaSenha) {
        setErroSenha("Informe a nova senha.");
        return;
      }

      if (senhaForm.novaSenha.length < 6) {
        setErroSenha("A nova senha deve ter pelo menos 6 caracteres.");
        return;
      }

      if (senhaForm.novaSenha !== senhaForm.confirmarNovaSenha) {
        setErroSenha("As senhas não coincidem.");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: senhaForm.novaSenha,
      });

      if (error) {
        setErroSenha("Não foi possível atualizar a senha.");
        return;
      }

      setSenhaForm({
        novaSenha: "",
        confirmarNovaSenha: "",
      });

      setSucessoSenha("Senha atualizada com sucesso.");
    } catch {
      setErroSenha("Erro ao atualizar senha.");
    } finally {
      setSavingSenha(false);
    }
  }

  async function handleExcluirConta() {
    try {
      setDeletingConta(true);
      setErroExcluir(null);

      const response = await fetch("/api/account/delete", {
        method: "DELETE",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setErroExcluir(
          result?.error || "Não foi possível excluir a conta agora."
        );
        return;
      }

      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setErroExcluir("Erro ao excluir a conta.");
    } finally {
      setDeletingConta(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <section className="rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-sm md:px-8">
          <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-10 w-56 animate-pulse rounded-2xl bg-slate-200" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded-full bg-slate-100" />
        </section>

        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-4 h-4 w-72 animate-pulse rounded-full bg-slate-100" />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[32px] border border-slate-200 bg-gradient-to-r from-white to-slate-50 px-6 py-8 shadow-sm md:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-xl font-semibold text-white shadow-sm">
                {inicial}
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  <User className="h-3.5 w-3.5" />
                  Conta
                </div>

                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
                  Perfil
                </h1>

                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {nomeCompleto || "Usuário"} • {email || "Sem e-mail"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <Card
          title="Informações da conta"
          subtitle="Esses dados são usados para personalizar sua experiência dentro do app."
          icon={<User className="h-5 w-5" />}
        >
          {erroPerfil ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {erroPerfil}
            </div>
          ) : null}

          {sucessoPerfil ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {sucessoPerfil}
            </div>
          ) : null}

          <form onSubmit={handleSalvarPerfil} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label>Nome</Label>
                <Input
                  type="text"
                  value={perfil.nome}
                  onChange={(e) =>
                    setPerfil((prev) => ({ ...prev, nome: e.target.value }))
                  }
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <Label>Sobrenome</Label>
                <Input
                  type="text"
                  value={perfil.sobrenome}
                  onChange={(e) =>
                    setPerfil((prev) => ({ ...prev, sobrenome: e.target.value }))
                  }
                  placeholder="Seu sobrenome"
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label>Nome completo</Label>
                <Input type="text" value={nomeCompleto} disabled />
              </div>

              <div>
                <Label>E-mail</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input type="email" value={email} disabled className="pl-11" />
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-5">
              <button
                type="submit"
                disabled={savingPerfil}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {savingPerfil ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        </Card>

        <Card
          title="Segurança"
          subtitle="Atualize sua senha para manter sua conta protegida."
          icon={<Shield className="h-5 w-5" />}
        >
          {erroSenha ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {erroSenha}
            </div>
          ) : null}

          {sucessoSenha ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {sucessoSenha}
            </div>
          ) : null}

          <form onSubmit={handleSalvarSenha} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label>Nova senha</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="password"
                    value={senhaForm.novaSenha}
                    onChange={(e) =>
                      setSenhaForm((prev) => ({
                        ...prev,
                        novaSenha: e.target.value,
                      }))
                    }
                    placeholder="********"
                    className="pl-11"
                  />
                </div>
              </div>

              <div>
                <Label>Confirmar nova senha</Label>
                <Input
                  type="password"
                  value={senhaForm.confirmarNovaSenha}
                  onChange={(e) =>
                    setSenhaForm((prev) => ({
                      ...prev,
                      confirmarNovaSenha: e.target.value,
                    }))
                  }
                  placeholder="********"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Recomendação: use pelo menos 6 caracteres e evite repetir senhas de
              outros serviços.
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-5">
              <button
                type="submit"
                disabled={savingSenha}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                {savingSenha ? "Atualizando..." : "Atualizar senha"}
              </button>
            </div>
          </form>
        </Card>

        <Card
          title="Zona de perigo"
          subtitle="Exclua sua conta e os dados vinculados a ela. Essa ação é irreversível."
          icon={<AlertTriangle className="h-5 w-5" />}
        >
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
            <h3 className="text-base font-semibold text-rose-900">
              Excluir conta
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-rose-800">
              Ao confirmar, sua conta será removida do sistema e você perderá
              acesso ao app com este usuário.
            </p>

            <button
              type="button"
              onClick={() => {
                setErroExcluir(null);
                setConfirmacaoExcluir("");
                setModalExcluirOpen(true);
              }}
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-300 bg-white px-5 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
            >
              <Trash2 className="h-4 w-4" />
              Excluir conta
            </button>
          </div>
        </Card>
      </div>

      <DangerModal
        open={modalExcluirOpen}
        onClose={() => {
          if (deletingConta) return;
          setModalExcluirOpen(false);
          setConfirmacaoExcluir("");
          setErroExcluir(null);
        }}
        onConfirm={handleExcluirConta}
        email={email}
        confirmacao={confirmacaoExcluir}
        setConfirmacao={setConfirmacaoExcluir}
        loading={deletingConta}
        erro={erroExcluir}
      />
    </>
  );
}