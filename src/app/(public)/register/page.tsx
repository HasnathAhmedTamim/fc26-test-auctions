import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { RegisterForm } from "@/components/auth/register-form";
import { getSafePath, resolvePostAuthPath } from "@/lib/safe-path";

export const metadata: Metadata = {
  title: "Register | FC26 Auction",
  description: "Create a manager account for your FC26 auction league.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  // Server-side session check prevents logged-in users from seeing this page.
  const session = await auth();
  const { callbackUrl } = await searchParams;
  const safeCallback = getSafePath(callbackUrl);

  if (session?.user) {
    redirect(resolvePostAuthPath(safeCallback, session.user.role));
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
            New accounts are created as manager roles by default. After registering, ask your admin to
            grant room access before joining an auction.
          </p>
          <RegisterForm callbackUrl={safeCallback} />

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-emerald-300 hover:text-emerald-200">
              Login here
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}