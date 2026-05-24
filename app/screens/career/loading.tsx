import { Shimmer, ShimmerCard } from '@/app/components/Shimmer';

export default function CareerLoading() {
  return (
    <main className="pt-24 px-6 max-w-[1200px] 2xl:max-w-[min(92vw,1700px)] mx-auto pb-24">
      <div className="flex justify-between items-end mb-12">
        <div>
          <Shimmer className="h-2.5 w-20 mb-3" />
          <Shimmer className="h-11 w-56" />
        </div>
        <Shimmer className="h-9 w-28 rounded-full" />
      </div>

      <div className="flex gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Shimmer key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <ShimmerCard key={i} className="h-48 space-y-4">
            <Shimmer className="h-3 w-32" />
            <Shimmer className="h-3 w-24" />
            <Shimmer className="h-20 w-full rounded-lg" />
            <Shimmer className="h-3 w-16" />
          </ShimmerCard>
        ))}
      </div>
    </main>
  );
}
