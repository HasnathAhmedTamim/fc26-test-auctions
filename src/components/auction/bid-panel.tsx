import { Button } from "@/components/ui/button";

type Props = {
  bidAmount: string;
  setBidAmount: (v: string) => void;
  minNextBid: number;
  onBid: () => void;
  error: string;
  disabled?: boolean;
};

export function BidPanel({
  bidAmount,
  setBidAmount,
  minNextBid,
  onBid,
  error,
  disabled,
}: Props) {
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
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
