import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { AuctionRoom } from "@/components/auction/auction-room";
import { getDb } from "@/lib/mongodb";

function toObjectId(value: string) {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}

export default async function AuctionPage({
  params,
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
    <section className="p-6">
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