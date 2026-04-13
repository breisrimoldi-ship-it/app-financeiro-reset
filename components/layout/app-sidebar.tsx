"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Wallet,
  Landmark,
 CreditCard,
  Target,
  User,
  LogOut,
  FileText,
  TrendingUp,
  ChevronDown,
  BarChart3,
  ArrowRightLeft,
  Package,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AppSidebarProps = {
  nomeUsuario?: string;
  emailUsuario?: string;
};

const itensPrincipais = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/movimentacoes", label: "Movimentações", icon: Wallet },
  { href: "/contas-bancarias", label: "Contas bancárias", icon: Landmark },
  { href: "/contas", label: "Contas fixas", icon: FileText },
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/perfil", label: "Perfil", icon: User },
];

const itensRendaVariavel = [
  { href: "/renda-variavel", label: "Resumo", icon: BarChart3 },
  { href: "/renda-variavel/transferir", label: "Transferências", icon: ArrowRightLeft },
  { href: "/renda-variavel/categorias", label: "Categorias", icon: FileText },
  { href: "/renda-variavel/insumos", label: "Insumos", icon: Package },
];

export function AppSidebar({
  nomeUsuario = "Usuário",
  emailUsuario,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const estaEmRendaVariavel =
    pathname === "/renda-variavel" ||
    pathname.startsWith("/renda-variavel/");

  const [rendaVariavelAbertaManual, setRendaVariavelAbertaManual] =
    useState(false);

  const rendaVariavelAberta =
    estaEmRendaVariavel || rendaVariavelAbertaManual;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-lg font-semibold text-slate-900">AuriaFin</p>
        <p className="mt-2 text-sm font-medium text-slate-800">
          {nomeUsuario}
        </p>
        <p className="truncate text-xs text-slate-500">
          {emailUsuario || "Seu painel financeiro"}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
              pathname === "/dashboard" || pathname.startsWith("/dashboard/")
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setRendaVariavelAbertaManual((prev) => !prev)}
              className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium transition ${
                estaEmRendaVariavel
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4" />
                Renda Variável
              </span>

              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  rendaVariavelAberta ? "rotate-180" : ""
                }`}
              />
            </button>

            {rendaVariavelAberta && (
              <div className="ml-3 space-y-1 border-l border-slate-200 pl-3">
                {itensRendaVariavel.map((item) => {
                  const Icon = item.icon;
                  const ativo =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                        ativo
                          ? "bg-slate-100 font-semibold text-slate-900"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {itensPrincipais.slice(1).map((item) => {
            const Icon = item.icon;
            const ativo =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                  ativo
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}