type RecomendacaoAcao = {
  tipo: "guardar_meta";
  valor: number;
  metaId: string;
  metaNome: string;
};

type RecomendacaoItem = {
  tipo: "acao" | "alerta";
  texto: string;
  acao?: RecomendacaoAcao;
};

type Props = {
  recomendacoes: RecomendacaoItem[];
  sugestoesReceita: string[];
  executarAcao: (acao: RecomendacaoAcao) => void;
};

export function RecomendacoesPanel({ recomendacoes, sugestoesReceita, executarAcao }: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-zinc-900">Próximas ações</h3>

      {recomendacoes.map((item, i) => {
        const estilo =
          item.tipo === "alerta"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700";

        return (
          <div
            key={`acao-${i}`}
            className={`rounded-2xl border px-4 py-3 text-sm font-medium ${estilo}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{item.texto}</span>
              {item.acao ? (
                <button
                  type="button"
                  onClick={() => executarAcao(item.acao!)}
                  className="shrink-0 rounded-xl bg-black px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                >
                  Guardar agora
                </button>
              ) : null}
            </div>
          </div>
        );
      })}

      {sugestoesReceita.slice(0, 2).map((texto, index) => (
        <div
          key={`sugestao-${index}`}
          className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700"
        >
          {texto}
        </div>
      ))}
    </div>
  );
}
