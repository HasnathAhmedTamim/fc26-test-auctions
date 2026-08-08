import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function TournamentNotFoundPage() {
  return (
    <section className="py-24">
      <Container className="max-w-lg text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">404</p>
        <h1 className="mt-3 text-4xl font-black">Tournament not found</h1>
        <p className="mt-4 text-slate-400">
          This tournament does not exist, may have been removed, or the link is incorrect.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="bg-emerald-500 text-black hover:bg-emerald-400">
            <Link href="/tournaments">Browse tournaments</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
