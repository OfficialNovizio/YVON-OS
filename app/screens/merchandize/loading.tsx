import { Shimmer, ShimmerCard } from '@/app/components/Shimmer';

export default function MerchandizeLoading() {
  return (
    <main className="pt-24 px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto pb-24">
      <div className="flex justify-between items-end mb-12">
        <div>
          <Shimmer className="h-2.5 w-20 mb-3" />
          <Shimmer className="h-11 w-56" />
        </div>
        <div className="flex gap-3">
          <Shimmer className="h-9 w-28 rounded-full" />
          <Shimmer className="h-9 w-28 rounded-full" />
          <Shimmer className="h-9 w-28 rounded-full" />
          <Shimmer className="h-9 w-28 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ShimmerCard key={i} className="h-64 space-y-3">
            <Shimmer className="h-36 w-full rounded-lg" />
            <Shimmer className="h-3 w-24" />
            <Shimmer className="h-3 w-16" />
            <Shimmer className="h-4 w-20" />
          </ShimmerCard>
        ))}
      </div>
    </main>
  );
}
