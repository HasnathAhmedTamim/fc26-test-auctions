import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/container";

const TOURNAMENT_WINNER = {
  src: "/tournament-winner.jpg",
  width: 1208,
  height: 1539,
  alt: "FC26 tournament winner celebration",
} as const;

export function HomeWinnerBanner() {
  return (
    <section className="py-8">
      <Container>
        <article className="overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 via-emerald-500/10 to-cyan-500/10">
          <div className="flex flex-col lg:flex-row lg:items-stretch">
            <figure className="relative w-full shrink-0 overflow-hidden lg:w-[min(42%,440px)]">
              {/* Mobile/tablet: wide crop. Desktop: full portrait ratio. */}
              <div className="relative aspect-[16/10] max-h-[240px] w-full sm:aspect-[3/2] sm:max-h-[300px] md:max-h-[340px] lg:aspect-[1208/1539] lg:max-h-none">
                <Image
                  src={TOURNAMENT_WINNER.src}
                  alt={TOURNAMENT_WINNER.alt}
                  fill
                  priority
                  quality={82}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 440px"
                  className="object-cover object-[center_22%] lg:object-[center_28%]"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-slate-950/35"
                  aria-hidden
                />
              </div>
            </figure>

            <div className="flex flex-1 flex-col justify-center px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Tournament Announcement</p>
              <h2 className="mt-2 text-xl font-black leading-tight sm:text-2xl md:text-3xl lg:text-4xl">
                Congratulations to our latest champion
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Another FC26 league season is in the books. The tournament winner has been crowned after
                auction night, squad building, and knockout fixtures — proof that smart bidding wins titles.
              </p>
              <Link
                href="/tournaments"
                className="mt-5 inline-flex w-fit rounded-full border border-amber-400/40 bg-amber-500/10 px-5 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20"
              >
                View tournaments →
              </Link>
            </div>
          </div>
        </article>
      </Container>
    </section>
  );
}
