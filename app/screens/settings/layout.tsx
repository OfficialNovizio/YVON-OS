import React from 'react';
import NavBar from '@/app/components/Nav/NavBar';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 -z-10" style={{
        backgroundImage: "url('/Background Image.jpg')",
        backgroundSize: 'cover', backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat', backgroundColor: '#ffffff',
      }} />
      <div className="min-h-screen">
      <NavBar />
      {children}
      </div>
    </>
  );
}
