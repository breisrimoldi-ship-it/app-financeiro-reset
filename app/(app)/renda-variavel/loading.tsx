export default function Loading() {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <div className="h-36 animate-pulse rounded-3xl bg-zinc-200" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="h-36 animate-pulse rounded-3xl bg-zinc-200" />
          <div className="h-36 animate-pulse rounded-3xl bg-zinc-200" />
          <div className="h-36 animate-pulse rounded-3xl bg-zinc-200" />
          <div className="h-36 animate-pulse rounded-3xl bg-zinc-200" />
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="h-72 animate-pulse rounded-3xl bg-zinc-200" />
          <div className="h-72 animate-pulse rounded-3xl bg-zinc-200" />
        </div>
        <div className="h-80 animate-pulse rounded-3xl bg-zinc-200" />
      </div>
    </main>
  );
}