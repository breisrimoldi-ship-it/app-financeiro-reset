import React from "react";

export function MetasSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-4x1 border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <div className="h-5 w-32 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-4 h-10 w-72 animate-pulse rounded-2xl bg-slate-200" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded-full bg-slate-100" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm"
          >
            <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 h-8 w-32 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-3 h-4 w-40 animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm"
          >
            <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 h-4 w-60 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-6 h-3 w-full animate-pulse rounded-full bg-slate-100" />
            <div className="mt-6 h-10 w-full animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
