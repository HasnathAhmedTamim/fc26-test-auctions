import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { TournamentDetailView } from "@/components/tournaments/tournament-detail-view";
import { tournaments } from "@/data/tournaments";
import { getDb } from "@/lib/mongodb";
import { mapTournamentDocument } from "@/lib/tournaments/map-tournament";

async function getTournamentById(id: string) {
  try {
    const db = await getDb();
    const entry = await db.collection("tournaments").findOne({ id });
    if (entry) return mapTournamentDocument(entry as Record<string, unknown>);
  } catch {
    // Fall back to static seed data when DB is unavailable.
  }

  return tournaments.find((item) => item.id === id) ?? null;
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const tournament = await getTournamentById(id);

  if (!tournament) {
    notFound();
  }

  const viewerRole =
    session?.user?.role === "admin" ? "admin" : session?.user?.role === "manager" ? "manager" : "guest";

  return (
    <section className="py-10">
      <Container>
        <Breadcrumbs />
        <TournamentDetailView
          tournament={tournament}
          viewerRole={viewerRole}
          managerTeamName={session?.user?.name ?? null}
        />
      </Container>
    </section>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournamentById(id);
  return {
    title: tournament ? `${tournament.name} | FC26 Auction` : "Tournament | FC26 Auction",
  };
}
