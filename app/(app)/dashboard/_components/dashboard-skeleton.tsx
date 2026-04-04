export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#f6f8fb] px-6 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-44 animate-pulse rounded-3xl bg-zinc-200/80" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="h-36 animate-pulse rounded-3xl bg-zinc-200/80" />
          <div className="h-36 animate-pulse rounded-3xl bg-zinc-200/80" />
          <div className="h-36 animate-pulse rounded-3xl bg-zinc-200/80" />
          <div className="h-36 animate-pulse rounded-3xl bg-zinc-200/80" />
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="h-56 animate-pulse rounded-3xl bg-zinc-200/80" />
          <div className="h-56 animate-pulse rounded-3xl bg-zinc-200/80" />
        </div>
      </div>
    </div>
  );
}
