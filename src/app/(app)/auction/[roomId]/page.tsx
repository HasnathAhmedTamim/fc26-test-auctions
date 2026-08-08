import { auth } from "@/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuctionRoom } from "@/components/auction/auction-room";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { getDb } from "@/lib/mongodb";
import { toObjectId } from "@/lib/db/object-id";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ roomId: string }>;
}): Promise<Metadata> {
  const { roomId } = await params;

  try {
    const db = await getDb();
    const room = await db.collection("auctionRooms").findOne(
      { roomId },
      { projection: { name: 1 } }
    );
    const name = room?.name ? String(room.name) : roomId;
    return {
      title: `${name} | Auction | FC26 Auction`,
      description: `Live auction room for ${name}.`,
    };
  } catch {
    return {
      title: `Auction Room | FC26 Auction`,
    };
  }
}

export default async function AuctionPage({  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { roomId } = await params;

  if (session.user.role !== "admin") {
    const db = await getDb();
    const userObjectId = toObjectId(session.user.id);
    const accessQuery = userObjectId
      ? {
          roomId,
          canJoin: true,
          $or: [{ userId: session.user.id }, { userId: userObjectId }],
        }
      : {
          roomId,
          userId: session.user.id,
          canJoin: true,
        };

    const permission = await db.collection("roomAccess").findOne({
      ...accessQuery,
    });

    if (!permission) {
      redirect(`/dashboard?joinDenied=1&roomId=${encodeURIComponent(roomId)}`);
    }
  }

  return (
    <section className="p-4 sm:p-6">
      <Breadcrumbs />
      <AuctionRoom
        roomId={roomId}
        user={{
          id: session.user.id,
          name: session.user.name ?? "Unknown",
          role: session.user.role,
        }}
      />
    </section>
  );
}