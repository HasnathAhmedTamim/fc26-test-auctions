import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/lib/mongodb";
import { toObjectId } from "@/lib/db/object-id";
import { Button } from "@/components/ui/button";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { playerProfilePath } from "@/lib/players/profile-path";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ joinDenied?: string; roomId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const params = await searchParams;

  const db = await getDb();
  const roomsCollection = db.collection("auctionRooms");
  const statsCollection = db.collection("managerStats");
  const roomAccessCollection = db.collection("roomAccess");

  let allowedRoomIds: string[] | null = null;

  if (session.user.role !== "admin") {
    const userObjectId = toObjectId(session.user.id);
    const accessQuery = userObjectId
      ? {
          canJoin: true,
          $or: [{ userId: session.user.id }, { userId: userObjectId }],
        }
      : {
          canJoin: true,
          userId: session.user.id,
        };

    const roomAccessRows = await roomAccessCollection
      .find(accessQuery, { projection: { roomId: 1 } })
      .toArray();

    allowedRoomIds = [
      ...new Set(roomAccessRows.map((row) => String(row.roomId ?? "")).filter(Boolean)),
    ];
  }

  const roomScopeQuery = allowedRoomIds
    ? (allowedRoomIds.length ? { roomId: { $in: allowedRoomIds } } : { roomId: { $in: [] } })
    : {};

  function withRoomScope(baseQuery: Record<string, unknown>) {
    // Managers are restricted to assigned rooms; admins query without room constraints.
    if (!allowedRoomIds) return baseQuery;
    return {
      $and: [roomScopeQuery, baseQuery],
    };
  }
  const allowedRoomSet = new Set(allowedRoomIds ?? []);
  const allRooms = await roomsCollection.find({}).sort({ createdAt: -1 }).toArray();
  const roomById = new Map(allRooms.map((room) => [String(room.roomId ?? ""), room]));

  const userStatsRows = await statsCollection
    .find(withRoomScope({ userId: session.user.id }))
    .sort({ updatedAt: -1, createdAt: -1 })
    .toArray();

  const activeRoom = await roomsCollection.findOne(
    withRoomScope({ status: { $in: ["live", "waiting", "sold", "paused"] } }),
    { sort: { createdAt: -1 } }
  );

  let dashboardRoom = activeRoom;
  let stats = activeRoom
    ? await statsCollection.findOne({
        userId: session.user.id,
        roomId: activeRoom.roomId,
      })
    : null;

  if (!stats) {
    const latestStats = userStatsRows[0] ?? null;

    if (latestStats) {
      const statsRoom = await roomsCollection.findOne(
        withRoomScope({ roomId: latestStats.roomId })
      );
      dashboardRoom = statsRoom ?? dashboardRoom;
      stats = latestStats;
    }
  }

  const budgetLimit = dashboardRoom?.budget ?? 2000;
  const budgetSpent = stats?.budgetSpent ?? 0;
  const budgetLeft = Math.max(0, budgetLimit - budgetSpent);
  const playersBought: { playerId?: string; playerName: string; amount: number }[] =
    stats?.playersBought ?? [];
  const playersCardLabel = dashboardRoom ? "Players Bought (Current Room)" : "Players Bought (Latest Room)";
  const squadByRoom = userStatsRows
    .map((row) => {
      const roomId = String(row.roomId ?? "");
      const room = roomById.get(roomId);
      const bought = (row.playersBought ?? []) as {
        playerId?: string;
        playerName: string;
        amount: number;
      }[];

      return {
        roomId,
        roomName: String(room?.name ?? roomId),
        status: String(room?.status ?? "unknown").toUpperCase(),
        playersBought: bought,
        budgetSpent: Number(row.budgetSpent ?? 0),
      };
    })
    .filter((row) => row.playersBought.length > 0);
  const joinDenied = params.joinDenied === "1";
  const deniedRoomId = params.roomId?.trim();
  const accessCount = allowedRoomIds?.length ?? 0;
  const isManager = session.user.role !== "admin";
  const isAdmin = session.user.role === "admin";

  const joinableRooms = allRooms.filter((room) =>
    isAdmin ? true : allowedRoomSet.has(String(room.roomId ?? ""))
  );
  const priorityRoom =
    joinableRooms.find((room) => room.status === "live") ??
    joinableRooms.find((room) => ["waiting", "paused", "sold"].includes(String(room.status ?? ""))) ??
    joinableRooms[0] ??
    null;

  const chartRoomId = dashboardRoom ? String(dashboardRoom.roomId ?? "") : "";
  const roomManagerStats = chartRoomId
    ? await statsCollection.find({ roomId: chartRoomId }).toArray()
    : [];

  const managerUserIds = roomManagerStats.map((row) => String(row.userId ?? "")).filter(Boolean);
  const managerObjectIds = managerUserIds
    .map((id) => toObjectId(id))
    .filter((id): id is NonNullable<ReturnType<typeof toObjectId>> => Boolean(id));

  const managerUsers =
    managerObjectIds.length > 0
      ? await db
          .collection("users")
          .find({ _id: { $in: managerObjectIds } })
          .project({ name: 1, email: 1 })
          .toArray()
      : [];

  const managerNameById = new Map(
    managerUsers.map((user) => [String(user._id), String(user.name ?? user.email ?? "Manager")])
  );

  const squadBar = roomManagerStats
    .map((row) => {
      const bought = (row.playersBought ?? []) as unknown[];
      return {
        label: managerNameById.get(String(row.userId ?? "")) ?? "Manager",
        value: bought.length,
      };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const budgetPie = [
    { label: "Spent", value: budgetSpent, color: "#10b981" },
    { label: "Remaining", value: budgetLeft, color: "#0891b2" },
  ];

  const soldRows = chartRoomId
    ? await db
        .collection("soldPlayers")
        .find({ roomId: chartRoomId })
        .sort({ createdAt: 1 })
        .toArray()
    : [];

  const soldLine = soldRows.reduce<{ label: string; value: number }[]>((points, row, index) => {
    const createdAt = row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt ?? ""));
    const label = Number.isNaN(createdAt.getTime())
      ? `#${index + 1}`
      : createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    points.push({ label, value: index + 1 });
    return points;
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-black">Dashboard</h1>
      <p className="mt-2 text-slate-400">Welcome back, {session.user.name}.</p>

      {priorityRoom ? (
        <div className="mt-6 rounded-3xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
                {String(priorityRoom.status ?? "waiting").toUpperCase() === "LIVE"
                  ? "Auction is live"
                  : "Auction room ready"}
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                {String(priorityRoom.name ?? priorityRoom.roomId)}
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                Status: {String(priorityRoom.status ?? "waiting").toUpperCase()} • Room ID:{" "}
                {String(priorityRoom.roomId ?? "")}
              </p>
            </div>
            <Link href={`/auction/${String(priorityRoom.roomId ?? "")}`} className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-emerald-500 text-black hover:bg-emerald-400 sm:w-auto">
                {String(priorityRoom.status ?? "") === "live" ? "Join Live Auction" : "Enter Auction Room"}
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {isAdmin ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin">
            <Button size="sm" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              Open Admin Panel
            </Button>
          </Link>
        </div>
      ) : null}

      {joinDenied && deniedRoomId ? (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm font-semibold text-red-300">
            You cannot join{" "}
            {allRooms.find((room) => String(room.roomId) === deniedRoomId)?.name ?? deniedRoomId}{" "}
            right now.
          </p>
          <p className="mt-1 text-xs text-red-200/90">
            Admin has not granted access for this room yet. Ask admin to grant room access from the admin panel.
          </p>
        </div>
      ) : null}

      {isManager && accessCount === 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-300">No room access assigned yet.</p>
          <p className="mt-1 text-xs text-amber-100/90">
            You will be able to join auction rooms after an admin grants permission for your account.
          </p>
        </div>
      ) : null}

      {isManager && accessCount > 0 && !dashboardRoom ? (
        <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-300">Room access is active.</p>
          <p className="mt-1 text-xs text-emerald-100/90">
            You can join {accessCount} assigned room(s). Waiting for an active room state (waiting/live/sold/paused).
          </p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Budget Left</p>
          <p className="mt-2 text-3xl font-black">{budgetLeft} coins</p>
          <p className="mt-1 text-xs text-slate-500">{budgetSpent} spent of {budgetLimit}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">{playersCardLabel}</p>
          <p className="mt-2 text-3xl font-black">{playersBought.length}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Room Access</p>
          <p className="mt-2 text-3xl font-black">{isManager ? accessCount : allRooms.length}</p>
          <p className="mt-1 text-xs text-slate-500">
            {isManager
              ? dashboardRoom
                ? `Current accessible room: ${String(dashboardRoom.name ?? dashboardRoom.roomId)} (${String(dashboardRoom.status ?? "waiting").toUpperCase()})`
                : "No active accessible room right now"
              : "Admin can join any room"}
          </p>
        </div>
      </div>

      <DashboardCharts squadBar={squadBar} budgetPie={budgetPie} soldLine={soldLine} />

      <div className="mt-8">
        <h2 className="text-lg font-bold text-slate-200">Quick Actions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/lineup"
            className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-400/40 hover:bg-emerald-500/5"
          >
            <p className="font-semibold text-white">Lineup Builder</p>
            <p className="mt-1 text-sm text-slate-400">Set your starting XI from bought players</p>
          </Link>
          <Link
            href="/dashboard/achievements"
            className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-400/40 hover:bg-emerald-500/5"
          >
            <p className="font-semibold text-white">Achievements</p>
            <p className="mt-1 text-sm text-slate-400">Track badges and tournament milestones</p>
          </Link>
          <Link
            href="/players"
            className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-400/40 hover:bg-emerald-500/5"
          >
            <p className="font-semibold text-white">Browse Players</p>
            <p className="mt-1 text-sm text-slate-400">Search ratings, positions, and prices</p>
          </Link>
          <Link
            href="/players/compare"
            className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-400/40 hover:bg-emerald-500/5"
          >
            <p className="font-semibold text-white">Compare Players</p>
            <p className="mt-1 text-sm text-slate-400">Side-by-side stats for up to four players</p>
          </Link>
        </div>
      </div>

      {isManager && (
        <div className="mt-8">
          <h2 className="text-xl font-bold">Room Access Overview</h2>
          <p className="mt-1 text-sm text-slate-400">
            Rooms marked &quot;No access&quot; cannot be joined until admin grants permission.
          </p>

          {allRooms.length === 0 ? (
            <p className="mt-4 text-slate-400">No auction rooms available yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {allRooms.map((room) => {
                const hasAccess = allowedRoomSet.has(String(room.roomId ?? ""));
                return (
                  <div
                    key={String(room.roomId ?? "")}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{String(room.name ?? "Room")}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          ID: {String(room.roomId ?? "")} • Status: {String(room.status ?? "waiting").toUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${hasAccess ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}
                        >
                          {hasAccess ? "Access granted" : "No access"}
                        </span>
                        {hasAccess ? (
                          <Link href={`/auction/${String(room.roomId ?? "")}`}>
                            <Button size="sm" className="bg-emerald-500 text-black hover:bg-emerald-400">
                              Join
                            </Button>
                          </Link>
                        ) : (
                          <div className="text-right">
                            <Button size="sm" variant="outline" className="border-red-500/30 bg-transparent text-red-300" disabled>
                              You can&apos;t join
                            </Button>
                            <p className="mt-1 text-[11px] text-slate-500">No access yet. Ask admin.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {squadByRoom.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold">Your Squad by Room</h2>
          <p className="mt-1 text-sm text-slate-400">
            Each room has its own bought players list so you can clearly track who was bought where.
          </p>
          <div className="mt-4 space-y-4">
            {squadByRoom.map((roomStats) => (
              <div key={roomStats.roomId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{roomStats.roomName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      ID: {roomStats.roomId} • Status: {roomStats.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Players: {roomStats.playersBought.length}</p>
                    <p className="text-xs text-slate-500">Spent: {roomStats.budgetSpent} coins</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {roomStats.playersBought.map((p, i) => (
                    <Link
                      key={`${roomStats.roomId}-${i}`}
                      href={playerProfilePath(p.playerId, p.playerName)}
                      className="rounded-xl border border-white/10 bg-black/20 p-3 transition hover:border-emerald-400/30 hover:bg-emerald-500/5"
                    >
                      <p className="font-semibold text-white">{p.playerName}</p>
                      <p className="mt-1 text-sm text-emerald-400">{p.amount} coins</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}