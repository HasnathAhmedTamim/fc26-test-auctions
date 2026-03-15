import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <section className="p-10">
      <h1 className="text-3xl font-black">Admin Panel</h1>
      <p className="mt-3 text-slate-400">
        Manage tournaments, approve managers, and control the live auction.
      </p>
    </section>
  );
}