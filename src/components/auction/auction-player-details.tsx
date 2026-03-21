import Image from "next/image";
import { AuctionPlayer } from "@/types/auction";

type AttributePair = {
  label: string;
  value: number;
};

type Props = {
  player: AuctionPlayer | null;
};

const LEAGUE_BY_CLUB: Record<string, string> = {
  "Real Madrid": "LALIGA EA SPORTS",
  "Manchester City": "Premier League",
  Liverpool: "Premier League",
};

function clamp(value: number) {
  return Math.max(1, Math.min(99, Math.round(value)));
}

function deriveFaceStats(player: AuctionPlayer) {
  return {
    pace: player.pace ?? clamp(player.rating + 2),
    shooting: player.shooting ?? clamp(player.rating - 1),
    passing: player.passing ?? clamp(player.rating - 3),
    dribbling: player.dribbling ?? clamp(player.rating),
    defending: player.defending ?? clamp(player.rating - 25),
    physicality: player.physicality ?? clamp(player.rating - 8),
  };
}

function deriveProfile(player: AuctionPlayer) {
  const preferredFoot = player.preferredFoot ?? (player.position.includes("L") ? "Left" : "Right");
  const weakFoot = player.weakFoot ?? 4;
  const skillMoves = player.skillMoves ?? 4;
  const height = player.height ?? "178cm / 5'10\"";
  const weight = player.weight ?? "74kg / 163lb";
  const age = player.age ?? 27;
  const altPositions = player.altPositions ?? [player.position];

  return {
    preferredFoot,
    weakFoot,
    skillMoves,
    height,
    weight,
    age,
    altPositions,
  };
}

function deriveAttributeGroups(player: AuctionPlayer) {
  const s = deriveFaceStats(player);

  const groups: Array<{ title: string; items: AttributePair[] }> = [
    {
      title: "Pace",
      items: [
        { label: "Acceleration", value: clamp(s.pace + 2) },
        { label: "Sprint Speed", value: clamp(s.pace - 1) },
      ],
    },
    {
      title: "Shooting",
      items: [
        { label: "Positioning", value: clamp(s.shooting) },
        { label: "Finishing", value: clamp(s.shooting + 2) },
        { label: "Shot Power", value: clamp(s.shooting + 1) },
        { label: "Long Shots", value: clamp(s.shooting - 1) },
        { label: "Volleys", value: clamp(s.shooting - 2) },
        { label: "Penalties", value: clamp(s.shooting - 3) },
      ],
    },
    {
      title: "Passing",
      items: [
        { label: "Vision", value: clamp(s.passing + 2) },
        { label: "Crossing", value: clamp(s.passing + 1) },
        { label: "Free Kick Accuracy", value: clamp(s.passing - 1) },
        { label: "Short Passing", value: clamp(s.passing + 2) },
        { label: "Long Passing", value: clamp(s.passing) },
        { label: "Curve", value: clamp(s.passing - 1) },
      ],
    },
    {
      title: "Dribbling",
      items: [
        { label: "Agility", value: clamp(s.dribbling + 1) },
        { label: "Balance", value: clamp(s.dribbling - 1) },
        { label: "Reactions", value: clamp(player.rating + 1) },
        { label: "Ball Control", value: clamp(s.dribbling) },
        { label: "Dribbling", value: clamp(s.dribbling + 1) },
        { label: "Composure", value: clamp(player.rating) },
      ],
    },
    {
      title: "Defending",
      items: [
        { label: "Interceptions", value: clamp(s.defending) },
        { label: "Heading Accuracy", value: clamp(s.defending + 1) },
        { label: "Defensive Awareness", value: clamp(s.defending - 1) },
        { label: "Standing Tackle", value: clamp(s.defending) },
        { label: "Sliding Tackle", value: clamp(s.defending - 2) },
      ],
    },
    {
      title: "Physicality",
      items: [
        { label: "Jumping", value: clamp(s.physicality - 1) },
        { label: "Stamina", value: clamp(s.physicality + 2) },
        { label: "Strength", value: clamp(s.physicality) },
        { label: "Aggression", value: clamp(s.physicality - 1) },
      ],
    },
  ];

  return groups;
}

function derivePlaystyles(player: AuctionPlayer) {
  if (player.playstyles?.length) return player.playstyles;

  if (player.position.includes("ST") || player.position.includes("CF")) {
    return [
      { name: "Finesse Shot+", description: "Higher precision on finesse shots.", plus: true },
      { name: "First Touch", description: "Cleaner first touch under pressure." },
      { name: "Low Driven Shot", description: "Faster low driven finishing." },
    ];
  }

  if (player.position.includes("CM") || player.position.includes("CAM")) {
    return [
      { name: "Technical+", description: "Elite close control while turning.", plus: true },
      { name: "Whipped Pass", description: "Dangerous driven crosses and cutbacks." },
      { name: "Incisive Pass", description: "Sharper through-ball delivery." },
    ];
  }

  return [
    { name: "Anticipate", description: "Faster defensive read and interceptions." },
    { name: "Aerial", description: "Improved aerial duels." },
    { name: "Relentless", description: "Sustains intensity for longer phases." },
  ];
}

function statRow(label: string, value: number) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3" key={label}>
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

export function AuctionPlayerDetails({ player }: Props) {
  if (!player) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/3 p-6">
        <p className="text-slate-300">Waiting for admin to set a player.</p>
      </div>
    );
  }

  const face = deriveFaceStats(player);
  const profile = deriveProfile(player);
  const groups = deriveAttributeGroups(player);
  const playstyles = derivePlaystyles(player);
  const league = player.league ?? LEAGUE_BY_CLUB[player.club] ?? "FC Club League";
  const cardImageSrc = player.cardImage || player.image;
  const isRemoteCardImage = /^https?:\/\//i.test(cardImageSrc);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-linear-to-br from-slate-900 via-slate-950 to-black">
        <div className="flex items-center gap-5 p-5">
          {/* FC Card image displayed at proper aspect ratio */}
          <div className="relative h-44 w-32 shrink-0 overflow-hidden rounded-2xl shadow-2xl shadow-black/80">
            <Image
              src={cardImageSrc}
              alt={player.name}
              fill
              className="object-contain"
              sizes="128px"
              unoptimized={isRemoteCardImage}
            />
          </div>
          {/* Player info */}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-black leading-tight text-white">{player.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{player.club}</p>
            <p className="text-sm text-slate-500">{league} · {player.nation}</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">OVR</p>
                <p className="text-3xl font-black text-emerald-200">{player.rating}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">POS</p>
                <p className="text-xl font-black text-white">{player.position}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/3 p-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Profile</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <p className="text-sm text-slate-300">Preferred Foot: <span className="font-semibold text-white">{profile.preferredFoot}</span></p>
          <p className="text-sm text-slate-300">Weak Foot: <span className="font-semibold text-white">{profile.weakFoot}★</span></p>
          <p className="text-sm text-slate-300">Skill Moves: <span className="font-semibold text-white">{profile.skillMoves}★</span></p>
          <p className="text-sm text-slate-300">Height: <span className="font-semibold text-white">{profile.height}</span></p>
          <p className="text-sm text-slate-300">Weight: <span className="font-semibold text-white">{profile.weight}</span></p>
          <p className="text-sm text-slate-300">Alt Positions: <span className="font-semibold text-white">{profile.altPositions.join(", ")}</span></p>
          <p className="text-sm text-slate-300">Age: <span className="font-semibold text-white">{profile.age}</span></p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/3 p-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Face Stats</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {statRow("Pace", face.pace)}
          {statRow("Shooting", face.shooting)}
          {statRow("Passing", face.passing)}
          {statRow("Dribbling", face.dribbling)}
          {statRow("Defending", face.defending)}
          {statRow("Physicality", face.physicality)}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/3 p-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Full Attributes</h3>
        <div className="mt-4 space-y-3">
          {groups.map((group) => (
            <details key={group.title} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4" open={group.title === "Pace" || group.title === "Shooting"}>
              <summary className="cursor-pointer list-none text-base font-bold text-white">
                {group.title}
              </summary>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {group.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-3 py-2">
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <span className="text-sm font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/3 p-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">PlayStyles</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {playstyles.map((style) => (
            <div key={style.name} className="rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-200">
              <span className={style.plus ? "font-bold text-emerald-300" : "font-semibold text-white"}>{style.name}</span>
              <span className="ml-2 text-slate-400">{style.description}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/3 p-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Bio</h3>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {player.name} is a professional footballer from {player.nation} who plays as {player.position} for {player.club} in {league}. Overall rating: {player.rating}.
        </p>
      </section>
    </div>
  );
}
