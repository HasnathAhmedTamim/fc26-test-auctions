import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <section className="py-24">
      <Container className="max-w-lg text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">404</p>
        <h1 className="mt-3 text-4xl font-black">Page not found</h1>
        <p className="mt-4 text-slate-400">
          The page you requested does not exist or may have been moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="bg-emerald-500 text-black hover:bg-emerald-400">
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
