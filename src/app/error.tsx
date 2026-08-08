"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="py-24">
      <Container className="max-w-lg text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-red-400">Something went wrong</p>
        <h1 className="mt-3 text-4xl font-black">Unexpected error</h1>
        <p className="mt-4 text-slate-400">
          An error occurred while loading this page. You can retry or return to a safe page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset} className="bg-emerald-500 text-black hover:bg-emerald-400">
            Try again
          </Button>
          <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
