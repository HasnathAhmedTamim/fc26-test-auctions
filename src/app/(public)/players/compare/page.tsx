import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import CompareClient from "./compare-client";

export const metadata: Metadata = {
  title: "Compare Players | FC26 Auction",
  description: "Compare FC player attributes side by side before bidding.",
};

function CompareFallback() {
  return (
    <section className="py-10">
      <Container>
        <div className="h-10 w-56 animate-pulse rounded bg-white/10" />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
          ))}
        </div>
      </Container>
    </section>
  );
}

export default function PlayerComparePage() {
  return (
    <Suspense fallback={<CompareFallback />}>
      <CompareClient />
    </Suspense>
  );
}
