import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { createClient } from "@/lib/supabase/server";

function getNomeUsuario(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  const nomeCompleto =
    typeof user.user_metadata?.nome_completo === "string"
      ? user.user_metadata.nome_completo
      : "";

  const nome =
    typeof user.user_metadata?.nome === "string"
      ? user.user_metadata.nome
      : "";

  if (nomeCompleto.trim()) return nomeCompleto.trim();
  if (nome.trim()) return nome.trim();
  if (user.email) return user.email.split("@")[0];

  return "Usuário";
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nomeUsuario = getNomeUsuario(user);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <AppSidebar nomeUsuario={nomeUsuario} emailUsuario={user.email ?? ""} />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader nomeUsuario={nomeUsuario} />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}