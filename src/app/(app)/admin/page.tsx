import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/admin/admin-panel";

export default async function AdminPage() {
  const session = await auth();

  // Only authenticated users can access the admin route.
  if (!session?.user) {
    redirect("/login");
  }

  // Enforce admin-only access for this page.
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminPanel />;
}