import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuctionRoom } from "@/components/auction/auction-room";

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