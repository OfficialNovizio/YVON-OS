"use client";

import React, { ReactNode } from "react";

interface DashboardCardProps {
  className?: string;
  children: ReactNode;
}

export function DashboardCard({ className = "", children }: DashboardCardProps) {
  return (
    <div
      className={`
        bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl
        shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
}
