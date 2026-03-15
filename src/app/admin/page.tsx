import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/admin/admin-panel";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminPanel />;
}