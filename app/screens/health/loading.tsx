import { Shimmer, ShimmerCard } from '@/app/components/Shimmer';

export default function HealthLoading() {
  return (
    <main className="pt-24 px-6 max-w-[1200px] mx-auto pb-24">
      <div className="flex justify-between items-end mb-12">
        <div>
          <Shimmer className="h-2.5 w-20 mb-3" />
          <Shimmer className="h-9 w-56" />
        </div>
        <Shimmer className="h-6 w-28 rounded-full" />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <ShimmerCard key={i} className="space-y-3">
            <Shimmer className="h-2.5 w-16" />
            <Shimmer className="h-8 w-20" />
          </ShimmerCard>
        ))}
      </div>

      <ShimmerCard className="h-64" />
    </main>
  );
}
