export function DetalheItem({
  label,
  value,
  destaque,
}: {
  label: string;
  value: string;
  destaque?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className={`mt-2 text-sm font-semibold text-slate-900 ${destaque ?? ""}`}>
        {value}
      </p>
    </div>
  );
}
