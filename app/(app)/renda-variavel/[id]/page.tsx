type Props = {
  params: Promise<{ id: string }>;
};

export default async function DetalheLancamentoPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Detalhe do lançamento
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Aqui vamos mostrar os detalhes do lançamento <strong>{id}</strong>.
        </p>
      </div>
    </main>
  );
}