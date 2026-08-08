import { Button } from "@/components/ui/button";

type Props = {
  bidAmount: string;
  setBidAmount: (v: string) => void;
  minNextBid: number;
  maxBid?: number | null;
  onBid: () => void;
  error: string;
  disabled?: boolean;
};

export function BidPanel({
  bidAmount,
  setBidAmount,
  minNextBid,
  maxBid,
  onBid,
  error,
  disabled,
}: Props) {
  const parsedMax = maxBid != null && maxBid > 0 ? maxBid : null;

  function applyAmount(amount: number) {
    setBidAmount(String(Math.max(minNextBid, amount)));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <input
          aria-label="Bid amount"
          type="number"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          placeholder={`Min: ${minNextBid}`}
          disabled={disabled}
          className="w-full max-w-xs rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none disabled:opacity-50"
        />
        <Button
          onClick={onBid}
          disabled={disabled}
          className="bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50"
        >
          Place Bid
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => applyAmount(minNextBid)}
          className="border-white/20 bg-transparent text-white hover:bg-white/10"
        >
          Min ({minNextBid})
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => applyAmount(minNextBid + 10)}
          className="border-white/20 bg-transparent text-white hover:bg-white/10"
        >
          +10
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => applyAmount(minNextBid + 50)}
          className="border-white/20 bg-transparent text-white hover:bg-white/10"
        >
          +50
        </Button>
        {parsedMax != null ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || parsedMax < minNextBid}
            onClick={() => applyAmount(parsedMax)}
            className="border-emerald-500/30 bg-transparent text-emerald-300 hover:bg-emerald-500/10"
          >
            Max ({parsedMax})
          </Button>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
