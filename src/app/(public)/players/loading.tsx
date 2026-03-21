export default function LoadingPlayersPage() {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 h-8 w-48 animate-pulse rounded bg-white/10" />
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="h-80 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-3xl border border-white/10 bg-white/5"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
