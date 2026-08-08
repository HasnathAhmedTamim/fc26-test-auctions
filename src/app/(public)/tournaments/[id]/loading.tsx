import { Container } from "@/components/layout/container";

export default function LoadingTournamentDetailPage() {
  return (
    <section className="py-10">
      <Container className="space-y-6">
        <div className="h-10 w-72 animate-pulse rounded bg-white/10" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
          <div className="h-80 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
        </div>
      </Container>
    </section>
  );
}
