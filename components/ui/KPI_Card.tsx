"use client";

import React from "react";
import { DashboardCard } from "./DashboardCard";
import { cn } from "@/lib/utils";

interface KPICardProps {
  /** Top label, e.g. "KPI" or "Finished" */
  label: string;
  /** Big number, e.g. "3.78" */
  value: string;
  /** Delta text, e.g. "-5.4%" */
  delta?: string;
  /** Delta trend direction */
  trend?: "up" | "down";
  /** Small unit, e.g. "vs last week" */
  deltaLabel?: string;
  /** Highlighted green card variant */
  highlighted?: boolean;
  /** Optional icon shown top-left */
  icon?: React.ReactNode;
  className?: string;
}

export function KPI_Card({
  label,
  value,
  delta,
  trend,
  deltaLabel = "vs last week",
  highlighted,
  icon,
  className = "",
}: KPICardProps) {
  return (
    <DashboardCard
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between",
        highlighted &&
          "bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 border-green-400/30 shadow-[0_0_30px_rgba(34,197,94,0.12)]",
        className
      )}
    >
      {/* Glow background */}
      {highlighted && (
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10 blur-sm bg-green-400" />
      )}

      <div className="relative">
        <div className="flex items-center gap-2.5 mb-4">
          {icon && (
            <div
              className={cn(
                "p-2 rounded-lg flex items-center justify-center",
                highlighted ? "bg-white/20" : "bg-white/5"
              )}
            >
              {icon}
            </div>
          )}
          <span
            className={cn(
              "text-[9px] font-black uppercase tracking-[0.15em]",
              highlighted ? "text-green-100/90" : "text-gray-500"
            )}
          >
            {label}
          </span>
        </div>

        <div
          className="text-3xl font-black tracking-tight mb-1 text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {value}
        </div>

        {delta && (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-xs font-bold",
                trend === "up"
                  ? highlighted
                    ? "text-green-100"
                    : "text-green-400"
                  : "text-red-400"
              )}
            >
              {delta}
            </span>
            <span className="text-[10px] text-gray-600 font-semibold">
              {deltaLabel}
            </span>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
