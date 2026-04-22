import React from 'react';
import DashboardCard from '@/components/ui/DashboardCard';
import KPI_Card from '@/components/ui/KPI_Card';
import MetricCard from '@/components/ui/MetricCard';
import TrendGraph from '@/components/ui/TrendGraph';

// Mock Data based on the dashboard image
const kpiData = [
  { value: '3.78', subText: 'CEO Command', subValue: '94%', unit: 'over 7 days' },
  { value: '12.0', subText: 'Brand Health', subValue: '284K', unit: 'over 7 days' },
  { value: '5.8x', subText: 'Combined Reach', subValue: '3.8x', unit: 'over 7 days' },
];

const secondaryMetricData = [
  { title: 'KPI', value: '3.78', subtitle: 'CEO Command', indicator: { statusText: '📈 Trend', isPositive: true } },
  { title: 'Analytics', value: '94%', subtitle: 'Conversion Rate', indicator: { statusText: '⬆️ Improving', isPositive: true } },
  { title: 'Competitor', value: '284K', subtitle: 'Total Reach', indicator: { statusText: '🔥 High', isPositive: true } },
  { title: 'Dev Lead', value: '3.8x', subtitle: 'Average ROAS', indicator: { statusText: '✨ Stable', isPositive: false } },
];


const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-color-bg p-8 text-white/80 font-sans">

      {/* 1. Header/Banner Section (CEO Command Status) */}
      <DashboardCard className="p-6 mb-8 flex flex-col gap-4">
        <h1 className="text-4xl font-extrabold">CEO Command</h1>
        <p className="text-lg text-white/80">Hi. Let&apos;s make a count.</p>
      </DashboardCard>

      {/* 2. Primary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KPI_Card data={kpiData[0]} />
        <KPI_Card data={kpiData[1]} />
        <KPI_Card data={kpiData[2]} />
      </div>

      {/* 3. Large Trend Graph Area */}
      <div className="mb-8">
        <TrendGraph
            title="Anomaly Details"
            subtitle="Instagram engagement dropped 18% vs 7-day avg"
        />
      </div>

      {/* 4. Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {secondaryMetricData.map((data, index) => (
          <MetricCard
            key={index}
            title={data.title}
            value={data.value}
            subtitle={data.subtitle}
            indicator={data.indicator}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;