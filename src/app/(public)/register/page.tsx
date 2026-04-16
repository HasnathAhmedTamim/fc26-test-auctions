import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  // Server-side session check prevents logged-in users from seeing this page.
  const session = await auth();
  if (session?.user) {
    // Route users directly to their role-specific home page.
    redirect(session.user.role === "admin" ? "/admin" : "/dashboard");
  }

  return (
    // Decorative gradient layer + centered card container for the auth form.
    <section className="relative py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(45,212,191,0.14),transparent_40%),radial-gradient(circle_at_10%_100%,rgba(245,158,11,0.07),transparent_35%)]" />
      <Container className="relative max-w-md">
        <div className="panel-glass rounded-3xl p-8">
          <h1 className="text-3xl font-black">Register</h1>
          <p className="mt-2 text-slate-400">Create your manager account.</p>
          <p className="mt-2 text-sm text-slate-500">
            New accounts are created as manager roles by default.
          </p>
          <RegisterForm />
        </div>
      </Container>
    </section>
  );
}