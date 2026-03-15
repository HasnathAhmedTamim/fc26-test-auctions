import { BidEntry } from "@/types/auction";

type ActivityItem = {
  id: string;
  message: string;
  tone?: "neutral" | "warn" | "success";
  timestamp: string;
};

type Props = {
  bidHistory: BidEntry[];
  activityLog: ActivityItem[];
  soldPlayers: Array<{
    playerName: string;
    winnerName: string;
    amount: number;
    timestamp: string;
  }>;
};

export function LiveFeed({ bidHistory, activityLog, soldPlayers }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-black">Live Auction Events</h2>
        <div className="mt-4 max-h-55 space-y-3 overflow-y-auto pr-1">
          {activityLog.length === 0 ? (
            <p className="text-slate-400">No events yet.</p>
          ) : (
            activityLog
              .slice()
              .reverse()
              .map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-900 p-4">
                  <p
                    className={
                      item.tone === "success"
                        ? "font-semibold text-emerald-300"
                        : item.tone === "warn"
                          ? "font-semibold text-amber-300"
                          : "font-semibold text-slate-100"
                    }
                  >
                    {item.message}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-black">Sold Players</h2>
        <div className="mt-4 max-h-56 space-y-3 overflow-y-auto pr-1">
          {soldPlayers.length === 0 ? (
            <p className="text-slate-400">No sold players yet.</p>
          ) : (
            soldPlayers
              .slice()
              .reverse()
              .map((item, idx) => (
                <div key={`${item.playerName}-${item.timestamp}-${idx}`} className="rounded-2xl bg-slate-900 p-4">
                  <p className="font-semibold text-white">{item.playerName}</p>
                  <p className="mt-1 text-sm text-slate-300">{item.winnerName} won for {item.amount} coins</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(item.timestamp).toLocaleTimeString()}</p>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-black">Live Bid Feed</h2>
        <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
          {bidHistory.length === 0 ? (
            <p className="text-slate-400">No bids yet.</p>
          ) : (
            bidHistory
              .slice()
              .reverse()
              .map((bid, index) => (
                <div
                  key={`${bid.userId}-${bid.timestamp}-${index}`}
                  className="rounded-2xl bg-slate-900 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{bid.userName}</p>
                    <p className="font-bold text-emerald-400">{bid.amount} coins</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(bid.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
