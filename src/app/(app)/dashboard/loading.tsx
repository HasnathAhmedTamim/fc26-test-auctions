export default function LoadingDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-56 animate-pulse rounded bg-white/10" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-3xl border border-white/10 bg-white/5"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
    </div>
  );
}
