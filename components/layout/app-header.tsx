type AppHeaderProps = {
  nomeUsuario: string;
};

export function AppHeader({ nomeUsuario }: AppHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Painel</h2>
          <p className="text-sm text-slate-500">
            Olá, {nomeUsuario}. Bem-vindo de volta.
          </p>
        </div>
      </div>
    </header>
  );
}