"use client";

import React from "react";
import { KPI_Card } from "./KPI_Card";

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down";
  highlighted?: boolean;
  icon?: React.ReactNode;
}

/** Thin wrapper around KPI_Card for quick metric displays. */
export function MetricCard({
  label,
  value,
  delta,
  trend,
  highlighted,
  icon,
}: MetricCardProps) {
  return (
    <KPI_Card
      label={label}
      value={String(value)}
      delta={delta}
      trend={trend}
      highlighted={highlighted}
      icon={icon}
    />
  );
}
