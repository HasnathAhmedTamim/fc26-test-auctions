export default function LoadingAuctionRoomPage() {
  return (
    <section className="p-6">
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="h-96 animate-pulse rounded-3xl border border-white/10 bg-white/5 xl:col-span-5" />
        <div className="h-96 animate-pulse rounded-3xl border border-white/10 bg-white/5 xl:col-span-4" />
        <div className="h-96 animate-pulse rounded-3xl border border-white/10 bg-white/5 xl:col-span-3" />
      </div>
    </section>
  );
}
