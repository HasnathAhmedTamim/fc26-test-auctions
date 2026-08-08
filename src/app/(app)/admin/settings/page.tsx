import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminSettingsPage } from "@/components/admin/admin-settings-page";

export const metadata: Metadata = {
  title: "Admin Settings | FC26 Auction",
  description: "Configure auction defaults and active player edition.",
};

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