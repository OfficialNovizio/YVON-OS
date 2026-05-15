import React from 'react';
import NavBar from '@/app/components/Nav/NavBar';
import VentureGate from '@/app/components/VentureGate';

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url('/Background Image.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#ffffff',
        }}
      />
      <NavBar />
      <VentureGate screenName="Analytics">{children}</VentureGate>
    </div>
  );
}
