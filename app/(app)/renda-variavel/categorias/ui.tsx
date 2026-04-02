"use client";

import { useState, useTransition } from "react";
import {
  atualizarCategoria,
  criarCategoria,
  deletarCategoria,
  toggleCategoria,
} from "./actions";

type CategoriaCusto = {
  id: string;
  user_id: string;
  nome: string;
  ativo: boolean;
  descricao_padrao: string | null;
  valor_padrao: number | null;
  usar_valor_padrao: boolean;
  created_at: string;
};

type CategoriasClientProps = {
  categorias: CategoriaCusto[];
};

export default function CategoriasClient({
  categorias,
}: CategoriasClientProps) {
  const [novaNome, setNovaNome] = useState("");
  const [novaDescricaoPadrao, setNovaDescricaoPadrao] = useState("");
  const [novoValorPadrao, setNovoValorPadrao] = useState("");
  const [novoUsarValorPadrao, setNovoUsarValorPadrao] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCriar() {
    startTransition(async () => {
      await criarCategoria({
        nome: novaNome,
        descricaoPadrao: novaDescricaoPadrao,
        valorPadrao: novoValorPadrao ? Number(novoValorPadrao) : null,
        usarValorPadrao: novoUsarValorPadrao,
      });

      setNovaNome("");
      setNovaDescricaoPadrao("");
      setNovoValorPadrao("");
      setNovoUsarValorPadrao(false);
    });
  }

  function handleAtualizar(
    id: string,
    nome: string,
    descricaoPadrao: string,
    valorPadrao: string,
    usarValorPadrao: boolean
  ) {
    startTransition(async () => {
      await atualizarCategoria(id, {
        nome,
        descricaoPadrao,
        valorPadrao: valorPadrao ? Number(valorPadrao) : null,
        usarValorPadrao,
      });
    });
  }

  function handleToggle(id: string, ativo: boolean) {
    startTransition(async () => {
      await toggleCategoria(id, ativo);
    });
  }

  function handleDeletar(id: string) {
    startTransition(async () => {
      await deletarCategoria(id);
    });
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">
          Categorias de custo
        </h1>
        <p className="text-sm text-slate-500">
          Cadastre categorias inteligentes com descrição padrão e valor fixo
          opcional para agilizar os lançamentos.
        </p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Nova categoria
          </h2>
          <p className="text-sm text-slate-500">
            Você pode deixar a categoria só como classificadora ou já configurar
            descrição e valor padrão.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nome</label>
            <input
              value={novaNome}
              onChange={(e) => setNovaNome(e.target.value)}
              placeholder="Ex.: Pedágio"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Descrição padrão
            </label>
            <input
              value={novaDescricaoPadrao}
              onChange={(e) => setNovaDescricaoPadrao(e.target.value)}
              placeholder="Ex.: Pedágio"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Valor padrão
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={novoValorPadrao}
              onChange={(e) => setNovoValorPadrao(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={novoUsarValorPadrao}
                onChange={(e) => setNovoUsarValorPadrao(e.target.checked)}
              />
              Usar valor padrão automaticamente
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCriar}
          disabled={isPending || !novaNome.trim()}
          className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Criar categoria
        </button>
      </section>

      <div className="space-y-4">
        {categorias.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm font-medium text-slate-900">
              Você ainda não tem categorias cadastradas.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Crie sua primeira categoria para usar nos custos da renda
              variável.
            </p>
          </div>
        ) : (
          categorias.map((cat) => (
            <CategoriaRow
              key={cat.id}
              categoria={cat}
              onSalvar={handleAtualizar}
              onToggle={handleToggle}
              onDeletar={handleDeletar}
              isPending={isPending}
            />
          ))
        )}
      </div>
    </main>
  );
}

type CategoriaRowProps = {
  categoria: CategoriaCusto;
  onSalvar: (
    id: string,
    nome: string,
    descricaoPadrao: string,
    valorPadrao: string,
    usarValorPadrao: boolean
  ) => void;
  onToggle: (id: string, ativo: boolean) => void;
  onDeletar: (id: string) => void;
  isPending: boolean;
};

function CategoriaRow({
  categoria,
  onSalvar,
  onToggle,
  onDeletar,
  isPending,
}: CategoriaRowProps) {
  const [nome, setNome] = useState(categoria.nome);
  const [descricaoPadrao, setDescricaoPadrao] = useState(
    categoria.descricao_padrao ?? ""
  );
  const [valorPadrao, setValorPadrao] = useState(
    categoria.valor_padrao != null ? String(categoria.valor_padrao) : ""
  );
  const [usarValorPadrao, setUsarValorPadrao] = useState(
    categoria.usar_valor_padrao
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Nome</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Descrição padrão
          </label>
          <input
            value={descricaoPadrao}
            onChange={(e) => setDescricaoPadrao(e.target.value)}
            placeholder="Opcional"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Valor padrão
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={valorPadrao}
            onChange={(e) => setValorPadrao(e.target.value)}
            placeholder="Opcional"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-slate-400"
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={usarValorPadrao}
              onChange={(e) => setUsarValorPadrao(e.target.checked)}
            />
            Usar valor padrão
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            onSalvar(
              categoria.id,
              nome,
              descricaoPadrao,
              valorPadrao,
              usarValorPadrao
            )
          }
          disabled={isPending || !nome.trim()}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Salvar
        </button>

        <button
          type="button"
          onClick={() => onToggle(categoria.id, !categoria.ativo)}
          disabled={isPending}
          className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
            categoria.ativo
              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {categoria.ativo ? "Ativa" : "Inativa"}
        </button>

        <button
          type="button"
          onClick={() => onDeletar(categoria.id)}
          disabled={isPending}
          className="rounded-2xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Excluir
        </button>
      </div>
    </section>
  );
}