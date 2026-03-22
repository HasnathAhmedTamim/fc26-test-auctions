import Link from "next/link";

type LogoProps = {
	compact?: boolean;
};

export function Logo({ compact = false }: LogoProps) {
	return (
		<Link href="/" className="inline-flex items-center gap-3">
			<span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-emerald-300/40 bg-emerald-400/20 shadow-[0_0_30px_rgba(45,212,191,0.25)]">
				<span className="text-lg font-black leading-none text-emerald-200">F</span>
				<span className="pointer-events-none absolute -right-2 -top-2 h-5 w-5 rounded-full bg-amber-300/70 blur-sm" />
			</span>
			{compact ? null : (
				<span className="leading-tight">
					<span className="block text-[1.15rem] font-bold text-emerald-300">FC26 Auction</span>
					<span className="block text-[0.68rem] uppercase tracking-[0.22em] text-slate-400">
						Live Squad Market
					</span>
				</span>
			)}
		</Link>
	);
}
