import { Container } from "@/components/layout/container";

const steps = [
  { title: "Register & get access", desc: "Create a manager account. Your admin grants room access." },
  { title: "Join the live room", desc: "Open the auction room when bidding starts." },
  { title: "Bid within budget", desc: "Place bids on players. Highest bid wins when the timer ends." },
  { title: "Build your squad", desc: "Set lineup, track achievements, and follow tournaments." },
];

export function HomeHowItWorks() {
  return (
    <section id="how-it-works" className="py-16">
      <Container>
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">How auction night works</p>
        <h2 className="mt-2 text-3xl font-black md:text-4xl">Four steps from login to lineup</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="panel-glass rounded-3xl p-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-lg font-black text-black">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{step.desc}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
