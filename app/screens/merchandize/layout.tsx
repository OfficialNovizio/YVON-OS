import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getActiveVentureSlug } from '@/lib/venture-context';
import NavBar from '@/app/components/Nav/NavBar';

export default async function MerchandizeLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const slug = getActiveVentureSlug(cookieStore);

  if (slug !== 'novizio') {
    redirect('/screens/ceo-command-dashboard');
  }

  return (
    <div className="min-h-screen bg-black">
      <NavBar />
      {children}
    </div>
  );
}
