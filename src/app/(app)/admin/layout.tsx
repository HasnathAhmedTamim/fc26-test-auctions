import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | FC26 Auction",
  description: "Manage auction rooms, users, rosters, and tournaments.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
