import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/lib/mongodb";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const db = await getDb();
  const [stats, activeRoom] = await Promise.all([
    db.collection("managerStats").findOne({ userId: session.user.id }),
    db.collection("auctionRooms").findOne({ status: { $in: ["live", "waiting", "sold"] } }),
  ]);

  const budgetLimit = activeRoom?.budget ?? 2000;
  const budgetSpent = stats?.budgetSpent ?? 0;
  const budgetLeft = budgetLimit - budgetSpent;
  const playersBought: { playerName: string; amount: number }[] = stats?.playersBought ?? [];

  return (
    <div>
      <h1 className="text-3xl font-black">Dashboard</h1>
      <p className="mt-2 text-slate-400">Welcome back, {session.user.name}.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Budget Left</p>
          <p className="mt-2 text-3xl font-black">{budgetLeft} coins</p>
          <p className="mt-1 text-xs text-slate-500">{budgetSpent} spent of {budgetLimit}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Players Bought</p>
          <p className="mt-2 text-3xl font-black">{playersBought.length}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Active Room</p>
          <p className="mt-2 text-xl font-black">
            {activeRoom ? activeRoom.status.toUpperCase() : "None"}
          </p>
          {activeRoom && (
            <Link href={`/auction/${activeRoom.roomId}`}>
              <Button size="sm" className="mt-3 bg-emerald-500 text-black hover:bg-emerald-400">
                Join Auction
              </Button>
            </Link>
          )}
        </div>
      </div>

      {playersBought.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold">Your Squad</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {playersBought.map((p, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold">{p.playerName}</p>
                <p className="mt-1 text-sm text-emerald-400">{p.amount} coins</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}