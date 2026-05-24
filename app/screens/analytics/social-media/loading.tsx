import { Shimmer } from '@/app/components/Shimmer';

export default function AnalyticsSubLoading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      <Shimmer className="h-8 w-48" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/10" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-white/10" />
    </div>
  );
}
