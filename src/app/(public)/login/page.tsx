import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  // Server-side auth check avoids showing the login form to already signed-in users.
  const session = await auth();
  const { callbackUrl } = await searchParams;

  // Keep role-based landing logic here for direct visits to /login.
  if (session?.user) {
    redirect(session.user.role === "admin" ? "/admin" : "/dashboard");
  }

  return (
    <section className="relative py-16">
      {/* Decorative background layer; intentionally non-interactive. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(45,212,191,0.12),transparent_35%),radial-gradient(circle_at_80%_90%,rgba(245,158,11,0.08),transparent_32%)]" />
      <Container className="relative max-w-md">
        <div className="panel-glass rounded-3xl p-8">
          <h1 className="text-3xl font-black">Login</h1>
          <p className="mt-2 text-slate-400">
            Access your team dashboard and auction room.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Use your manager credentials. Admin accounts will be redirected to the control panel.
          </p>
          {/* Preserve return path so users go back to their intended page after login. */}
          <LoginForm callbackUrl={callbackUrl} />
        </div>
      </Container>
    </section>
  );
}