import { Container } from "@/components/layout/container";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <section className="py-16">
      <Container className="max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-3xl font-black">Register</h1>
          <p className="mt-2 text-slate-400">Create your manager account.</p>
          <RegisterForm />
        </div>
      </Container>
    </section>
  );
}