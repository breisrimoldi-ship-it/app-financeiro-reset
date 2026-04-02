import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function PageShell({
  title,
  description,
  children,
  action,
}: PageShellProps) {
  return (
    <section className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>

          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}