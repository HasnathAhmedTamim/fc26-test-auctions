import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { players } from "@/data/players";

export default async function PlayerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = players.find((item) => item.id === id);

  if (!player) return notFound();

  return (
    <section className="py-10">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            <div className="relative h-[500px] w-full">
              <Image src={player.image} alt={player.name} fill className="object-cover" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-black">
                {player.rating} OVR
              </span>
              <span className="rounded-full border border-white/10 px-4 py-2 text-sm">
                {player.position}
              </span>
              <span className="rounded-full border border-white/10 px-4 py-2 text-sm">
                {player.price} coins
              </span>
            </div>

            <h1 className="mt-6 text-4xl font-black">{player.name}</h1>
            <p className="mt-3 text-lg text-slate-300">
              {player.club} • {player.nation}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["PACE", player.pace],
                ["SHOOTING", player.shooting],
                ["PASSING", player.passing],
                ["DRIBBLING", player.dribbling],
                ["DEFENDING", player.defending],
                ["PHYSICAL", player.physical],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="mt-2 text-2xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}