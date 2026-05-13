import React from 'react';
import NavBar from '@/app/components/Nav/NavBar';
import VentureGate from '@/app/components/VentureGate';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <NavBar />
      <VentureGate screenName="Marketing">{children}</VentureGate>
    </div>
  );
}
