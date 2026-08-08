export function AdminTabSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mt-4 space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-xl border border-white/10 bg-white/5"
        />
      ))}
    </div>
  );
}

export function AdminPanelSkeleton() {
  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-2">
      <div className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
      <div className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
    </div>
  );
}
