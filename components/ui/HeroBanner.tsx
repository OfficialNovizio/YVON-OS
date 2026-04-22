"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface HeroBannerProps {
  title: string;
  /** Accent-highlighted part of title, e.g. "today count." */
  titleAccent?: string;
  subtitle?: string;
  pills?: Array<{ label: string; value?: string }>;
  ctaText: string;
  ctaAccent?: string;
  onCtaClick: () => void;
  className?: string;
}

/**
 * Hero banner matching the reference: large green-accrue headline,
 * pill badges, and a CTA button.
 */
export function HeroBanner({
  title,
  titleAccent,
  subtitle,
  pills,
  ctaText,
  ctaAccent,
  onCtaClick,
  className = "",
}: HeroBannerProps) {
  return (
    <div className={cn("relative min-h-[calc(100vh-56px)]", className)}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#050505] via-[#0a1a0f] to-[#051a0a]" />
        <div
          className="absolute top-1/2 left-[25%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[120px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(0,200,83,0.2) 0%, rgba(0,137,45,0.1) 40%, transparent 70%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center px-8 py-10 min-h-[calc(100vh-56px)]">
        <h2
          className="text-[52px] font-black mb-3 tracking-tight leading-[1.1]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
          {titleAccent && (
            <span style={{ color: "var(--color-accent-bright)" }}>
              {titleAccent}
            </span>
          )}
        </h2>

        {subtitle && (
          <p className="text-sm text-gray-400 mb-8 font-medium tracking-widest uppercase">
            {subtitle}
          </p>
        )}

        {/* Pill badges */}
        {pills && pills.length > 0 && (
          <div className="flex items-center gap-3 mb-8">
            {pills.map((p, i) => (
              <div
                key={i}
                className="px-5 py-2.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gray-300"
              >
                {p.label}
                {p.value && (
                  <span style={{ color: "var(--color-accent)" }}>
                    {" "}
                    {p.value}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onCtaClick}
          className="w-fit px-10 py-4 text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-105 active:scale-95"
          style={{
            background: "var(--color-accent)",
            boxShadow: "0 10px 30px rgba(0,200,83,0.4)",
          }}
        >
          {ctaAccent
            ? ctaAccent
                .split("///")
                .map((part, i) => (
                  <span
                    key={i}
                    style={
                      i % 2 === 1
                        ? { color: "var(--color-accent-bright)" }
                        : undefined
                    }
                  >
                    {part}
                  </span>
                ))
            : ctaText}
        </button>
      </div>
    </div>
  );
}
