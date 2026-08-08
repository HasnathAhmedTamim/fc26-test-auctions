import Link from "next/link";

type LogoProps = {
  compact?: boolean;
  className?: string;
};

export function Logo({ compact = false, className = "" }: LogoProps) {
  return (
    <Link href="/" className={`inline-flex min-w-0 items-center gap-2 sm:gap-3 ${className}`}>
      <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-300/40 bg-emerald-400/20 shadow-[0_0_30px_rgba(45,212,191,0.25)] sm:h-9 sm:w-9">
        <span className="text-base font-black leading-none text-emerald-200 sm:text-lg">F</span>
        <span className="pointer-events-none absolute -right-2 -top-2 h-5 w-5 rounded-full bg-amber-300/70 blur-sm" />
      </span>
      {compact ? null : (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-base font-bold text-emerald-300 sm:text-[1.15rem]">FC26 Auction</span>
          <span className="hidden truncate text-[0.68rem] uppercase tracking-[0.22em] text-slate-400 sm:block">
            Live Squad Market
          </span>
        </span>
      )}
    </Link>
  );
}
