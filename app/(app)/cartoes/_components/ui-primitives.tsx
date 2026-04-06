import type {
  AbaButtonProps,
  ResumoCardProps,
  MiniResumoProps,
  MiniResumoBoxProps,
  StatusInfoProps,
  EmptyCardProps,
  FieldBlockProps,
} from "../_lib/types";

export function AbaButton({ active, onClick, icon, label }: AbaButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export function ResumoCard({ title, value, icon }: ResumoCardProps) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-linear-to-br from-slate-50 to-white p-6 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        {icon}
        {title}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

export function MiniResumo({ label, value }: MiniResumoProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function MiniResumoBox({
  label,
  value,
  sublabel,
  valueClassName,
}: MiniResumoBoxProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-1 text-lg font-bold text-slate-900 ${valueClassName ?? ""}`}
      >
        {value}
      </p>
      {sublabel ? <p className="mt-1 text-xs text-slate-500">{sublabel}</p> : null}
    </div>
  );
}

export function StatusInfo({
  label,
  value,
  danger,
  success,
}: StatusInfoProps) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        danger
          ? "border-red-200 bg-red-50"
          : success
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200"
      }`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-1 font-semibold ${
          danger
            ? "text-red-600"
            : success
            ? "text-emerald-700"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function EmptyCard({ text }: EmptyCardProps) {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
      {text}
    </div>
  );
}

export function FieldBlock({ label, htmlFor, children }: FieldBlockProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}
