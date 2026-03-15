import Image from "next/image";
import Link from "next/link";
import { Player } from "@/types/player";

export function PlayerCard({ player }: { player: Player }) {
  const imageSrc = player.image?.trim() ? player.image : "/player-placeholder.svg";

  return (
    <Link
      href={`/players/${player.id}`}
      className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-emerald-400/40"
    >
      <div className="relative h-60 w-full overflow-hidden">
        <Image
          src={imageSrc}
          alt={player.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">{player.name}</h3>
            <p className="text-sm text-slate-400">
              {player.club} • {player.nation}
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-500 px-3 py-2 text-center text-black">
            <p className="text-xs font-semibold">OVR</p>
            <p className="text-lg font-black">{player.rating}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>{player.position}</span>
          <span>{player.price} coins</span>
        </div>
      </div>
    </Link>
  );
}