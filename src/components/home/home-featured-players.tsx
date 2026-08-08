import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

type FeaturedPlayer = {
  id: string;
  name: string;
  rating: number;
  position: string;
  club: string;
  price: number;
  image: string;
};

export function HomeFeaturedPlayers({ players }: { players: FeaturedPlayer[] }) {
  return (
    <section className="py-16">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Featured players</p>
            <h2 className="mt-2 text-3xl font-black">Top OVR from the active catalog</h2>
          </div>
          <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
            <Link href="/players">View all players</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="panel-glass overflow-hidden rounded-3xl transition hover:-translate-y-1 hover:border-emerald-400/40"
            >
              <div className="relative h-48 w-full">
                <Image
                  src={player.image?.trim() ? player.image : "/player-placeholder.svg"}
                  alt={player.name}
                  fill
                  className="object-cover"
                  unoptimized={/^https?:\/\//i.test(player.image)}
                />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">{player.name}</h3>
                    <p className="text-sm text-slate-400">{player.club}</p>
                  </div>
                  <span className="rounded-xl bg-emerald-500 px-3 py-1 text-sm font-black text-black">
                    {player.rating}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  {player.position} • {player.price} coins
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
