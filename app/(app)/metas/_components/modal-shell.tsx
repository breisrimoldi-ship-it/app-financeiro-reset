import React from "react";
import { X } from "lucide-react";
import { classNames } from "../_lib/utils";

export function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  maxWidth = "max-w-2xl",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
        <div
          className={classNames(
            "flex max-h-[90vh] w-full flex-col overflow-hidden rounded-4x1 border border-slate-200 bg-white shadow-2xl",
            maxWidth
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
              {subtitle ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        </div>
      </div>
    </>
  );
}
