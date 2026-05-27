import React from 'react';
import NavBar from '@/app/components/Nav/NavBar';
import VentureGate from '@/app/components/VentureGate';

export default function WarRoomLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 -z-10" style={{
        backgroundImage: "url('/Background Image.jpg')",
        backgroundSize: 'cover', backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat', backgroundColor: '#080912',
      }} />
      <div className="min-h-screen">
      <NavBar />
      <VentureGate screenName="War Room">{children}</VentureGate>
      </div>
    </>
  );
}
