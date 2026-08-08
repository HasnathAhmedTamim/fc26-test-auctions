import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

type Props = {
  isLoggedIn: boolean;
  role?: "admin" | "manager";
};

export function HomeFinalCta({ isLoggedIn, role }: Props) {
  return (
    <section className="pb-24 pt-8">
      <Container>
        <div className="rounded-3xl border border-emerald-400/25 bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 p-8 md:p-10">
          <h2 className="text-3xl font-black">
            {isLoggedIn ? "Ready to enter the auction room?" : "Start your next auction night"}
          </h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            {isLoggedIn
              ? "Jump into your dashboard, join a live room, and build the squad that wins your league."
              : "Create your manager account, get room access from admin, and bid live when the catalog opens."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {isLoggedIn ? (
              <>
                <Button asChild className="bg-emerald-500 text-black hover:bg-emerald-400">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                {role === "admin" ? (
                  <Button asChild variant="outline" className="border-amber-400/30 bg-transparent text-amber-200">
                    <Link href="/admin">Open Admin Panel</Link>
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                <Button asChild className="bg-emerald-500 text-black hover:bg-emerald-400">
                  <Link href="/register">Register now</Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <Link href="/login">Login</Link>
                </Button>
              </>
            )}
            <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              <Link href="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
