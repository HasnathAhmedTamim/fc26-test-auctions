import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminSettingsPage } from "@/components/admin/admin-settings-page";

export default async function AdminSettingsRoutePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminSettingsPage />;
}