import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <section className="py-16">
      <Container className="max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-3xl font-black">Register</h1>
          <p className="mt-2 text-slate-400">Create your manager account.</p>

          <form className="mt-8 space-y-4">
            <input
              type="text"
              placeholder="Username"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
            />
            <Button className="w-full bg-emerald-500 text-black hover:bg-emerald-400">
              Create Account
            </Button>
          </form>
        </div>
      </Container>
    </section>
  );
}