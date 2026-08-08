import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Players | FC26 Auction",
  description: "Browse and scout players from the active auction pool.",
};

export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
