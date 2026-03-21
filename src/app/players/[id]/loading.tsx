export default function LoadingPlayerDetailsPage() {
  return (
    <section className="py-10">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
        <div className="h-130 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
        <div className="space-y-5">
          <div className="h-44 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
          <div className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
          <div className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
        </div>
      </div>
    </section>
  );
}
