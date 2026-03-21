export default function LoadingAdminPage() {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="h-10 w-60 animate-pulse rounded bg-white/10" />
        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <div className="h-96 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
          <div className="h-96 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
        </div>
      </div>
    </section>
  );
}
