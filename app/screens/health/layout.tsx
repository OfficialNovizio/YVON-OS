import React from 'react';
import NavBar from '@/app/components/Nav/NavBar';

export default function HealthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: '#ffffff',
        }}
      />
      <NavBar />
      {children}
    </div>
  );
}
