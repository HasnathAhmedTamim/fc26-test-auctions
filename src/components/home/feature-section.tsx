import { Container } from "@/components/layout/container";

const features = [
	{
		title: "Realtime Bidding",
		description: "Every increment appears instantly so managers never miss the winning moment.",
	},
	{
		title: "Squad Controls",
		description: "Budget and squad-slot limitations are enforced with clear room-level guardrails.",
	},
	{
		title: "Admin Command Center",
		description: "Start, pause, sell, and skip flows are controlled in a single room cockpit.",
	},
];

const steps = [
	"Create a room and set budget rules.",
	"Pick players and launch the live round.",
	"Managers bid, pass, and finalize squads.",
];

export function FeatureSection() {
	return (
		<section className="relative py-20">
			<Container>
				<div className="mb-8 flex items-end justify-between gap-4">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Platform Experience</p>
						<h2 className="mt-2 text-4xl font-black">Everything Needed For Auction Night</h2>
					</div>
					<p className="max-w-md text-sm text-slate-400">
						Designed to keep managers focused on decisions, not spreadsheets and manual tracking.
					</p>
				</div>

				<div className="grid gap-6 lg:grid-cols-3">
					{features.map((item, idx) => (
						<article
							key={item.title}
							className="panel-glass stagger-rise rounded-3xl p-6"
							style={{ animationDelay: `${idx * 90}ms` }}
						>
							<h3 className="text-2xl font-bold text-emerald-200">{item.title}</h3>
							<p className="mt-3 text-slate-300">{item.description}</p>
						</article>
					))}
				</div>

				<div className="mt-8 grid gap-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6 md:grid-cols-2">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-amber-300">How It Flows</p>
						<ol className="mt-4 space-y-2 text-slate-200">
							{steps.map((step) => (
								<li key={step} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
									{step}
								</li>
							))}
						</ol>
					</div>
					<div className="grid grid-cols-2 gap-4 text-center">
						<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
							<p className="text-xs text-slate-400">Realtime Events</p>
							<p className="mt-1 text-3xl font-black text-white">Live</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
							<p className="text-xs text-slate-400">Room Controls</p>
							<p className="mt-1 text-3xl font-black text-white">Admin</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
							<p className="text-xs text-slate-400">Budget Logic</p>
							<p className="mt-1 text-3xl font-black text-white">Guarded</p>
						</div>
						<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
							<p className="text-xs text-slate-400">Manager UX</p>
							<p className="mt-1 text-3xl font-black text-white">Focused</p>
						</div>
					</div>
				</div>
			</Container>
		</section>
	);
}
