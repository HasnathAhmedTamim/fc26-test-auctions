import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "admin" ? "/admin" : "/dashboard");
  }

  return (
    <section className="py-16">
      <Container className="max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-3xl font-black">Login</h1>
          <p className="mt-2 text-slate-400">
            Access your team dashboard and auction room.
          </p>
          <LoginForm />
        </div>
      </Container>
    </section>
  );
}