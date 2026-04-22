"use client";

import React, { ReactNode } from "react";
import { DashboardCard } from "./DashboardCard";
import { cn } from "@/lib/utils";

interface TrendGraphProps {
  title: string;
  subtitle?: string;
  dateRange?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Large wave/area-chart visualization card.
 * Use with Recharts AreaChart or Recharts LineChart as children,
 * or pass SVG/Canvas visualisations directly.
 */
export function TrendGraph({
  title,
  subtitle,
  dateRange,
  children,
  className = "",
}: TrendGraphProps) {
  return (
    <DashboardCard
      className={cn(
        "rounded-2xl p-6 flex flex-col overflow-hidden",
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2
            className="text-2xl font-bold text-white tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h2>
          {subtitle && (
            <span className="text-sm text-gray-500 mt-1 block">{subtitle}</span>
          )}
        </div>
        {dateRange && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{dateRange}</span>
          </div>
        )}
      </div>

      {/* Chart area — fills remaining height */}
      <div className="flex-1 min-h-0 relative">{children}</div>
    </DashboardCard>
  );
}
