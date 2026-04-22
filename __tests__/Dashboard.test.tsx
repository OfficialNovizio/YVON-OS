import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '@/app/Dashboard';

// Mocking the specific sub-components to isolate testing for the main layout assembly
jest.mock('@/components/ui/KPI_Card', () => ({
  __esModule: true,
  default: ({ data }: { data: any }) => (
    <div data-testid="kpi-card" data-kpi-value={data.value}>
      {data.value}
    </div>
  ),
}));

jest.mock('@/components/ui/MetricCard', () => ({
  __esModule: true,
  default: ({ title, value }: { title: string, value: string }) => (
    <div data-testid="metric-card">
      <div data-testid="metric-value">{value}</div>
      <div data-testid="metric-title">{title}</div>
    </div>
  ),
}));

jest.mock('@/components/ui/TrendGraph', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => (
    <div data-testid="trend-graph-container">
      <h2 data-testid="graph-title">{title}</h2>
      <div className="h-full bg-blue-900/10 flex items-end justify-around">
        {/* Mocking the complex wave structure */}
        <div className="w-3/5 h-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent absolute bottom-0 left-0"></div>
      </div>
    </div>
  ),
}));

describe('Dashboard Layout Structure', () => {

  // This test verifies the high-level composition and layout flow of the entire dashboard.
  test('renders all required core sections and components correctly', () => {
    render(<Dashboard />);

    // 1. Check Header
    expect(screen.getByText('CEO Command')).toBeInTheDocument();
    expect(screen.getByText('Hi. Let\'s make a count.')).toBeInTheDocument();

    // 2. Check Primary KPI Row (3 cards expected)
    const kpiCards = screen.getAllByTestId('kpi-card');
    expect(kpiCards).toHaveLength(3);
    // Check if the specific values are rendered, verifying the data props worked
    expect(screen.getByTestId('kpi-card')).toHaveTextContent('3.78');

    // 3. Check Trend Graph
    const trendGraph = screen.getByTestId('trend-graph-container');
    expect(trendGraph).toBeInTheDocument();
    expect(screen.getByTestId('graph-title')).toHaveTextContent('Anomaly Details');

    // 4. Check Secondary Metrics Row (4 cards expected)
    const metricCards = screen.getAllByTestId('metric-card');
    expect(metricCards).toHaveLength(4);
    // Spot-check a value from the secondary row
    expect(screen.getByTestId('metric-value')).toHaveTextContent('3.78');

  });
});