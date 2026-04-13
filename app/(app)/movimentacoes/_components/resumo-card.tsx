import { Wallet } from "lucide-react";

const toneMap = {
  neutral: {
    wrapper: "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
    text: "text-slate-900",
    icon: "text-slate-700",
  },
  success: {
    wrapper: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white",
    text: "text-emerald-600",
    icon: "text-emerald-600",
  },
  danger: {
    wrapper: "border-rose-100 bg-gradient-to-br from-rose-50 to-white",
    text: "text-rose-500",
    icon: "text-rose-500",
  },
  warning: {
    wrapper: "border-amber-100 bg-gradient-to-br from-amber-50 to-white",
    text: "text-amber-600",
    icon: "text-amber-600",
  },
};

export function ResumoCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "neutral" | "success" | "danger" | "warning";
}) {
  const current = toneMap[tone];

  return (
    <div
      className={`overflow-hidden rounded-[28px] border p-6 shadow-sm ${current.wrapper}`}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <Wallet className={`h-4 w-4 ${current.icon}`} />
        {title}
      </div>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${current.text}`}>
        {value}
      </p>
    </div>
  );
}
