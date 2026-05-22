'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';

async function issueAuthCookie(accessToken: string): Promise<boolean> {
  const res = await fetch('/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken }),
  })
  return res.ok
}

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If Supabase already has a valid session (e.g. HttpOnly cookie expired but
  // localStorage session is still live), re-issue the cookie silently.
  useEffect(() => {
    void supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.access_token) {
        const ok = await issueAuthCookie(session.access_token)
        if (ok) router.replace('/screens/ceo-command-dashboard')
      }
    })
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const email = userId.includes('@') ? userId : `${userId}@yvon.app`;

    const { data, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.session) {
      setError('Invalid credentials. Check your User ID and password.');
      setLoading(false);
      return;
    }

    const ok = await issueAuthCookie(data.session.access_token)
    if (!ok) {
      setError('Session could not be established. Try again.');
      setLoading(false);
      return;
    }

    router.replace('/screens/ceo-command-dashboard');
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0066cc]/8 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-12">
          <p className="text-[10px] font-bold tracking-[0.4em] text-white/30 uppercase mb-3">
            AI Operating System
          </p>
          <h1 className="text-5xl font-bold text-white tracking-tighter uppercase">
            YVON
          </h1>
        </div>

        {/* Card */}
        <div className="glass-card rounded-[24px] p-10 border border-white/[0.08]">
          <div className="mb-8">
            <h2 className="text-[17px] font-semibold text-white mb-1">
              Welcome back
            </h2>
            <p className="text-[13px] text-white/40">
              Sign in to your command center
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* User ID */}
            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-[0.15em] mb-2">
                User ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="yvon786"
                required
                autoComplete="username"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-[12px] px-4 py-3 text-[15px] text-white placeholder-white/20 focus:outline-none focus:border-[#0066cc]/60 focus:bg-white/[0.06] transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-[0.15em] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-[12px] px-4 py-3 text-[15px] text-white placeholder-white/20 focus:outline-none focus:border-[#0066cc]/60 focus:bg-white/[0.06] transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-[10px] px-4 py-3">
                <span className="material-symbols-outlined text-red-400 text-[16px]">error</span>
                <p className="text-[12px] text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0066cc] hover:bg-[#0071e3] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-[15px] py-3 rounded-[12px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Signing in…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">lock_open</span>
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-white/20 mt-8 tracking-widest uppercase">
          YVON · Restricted Access
        </p>
      </div>
    </div>
  );
}
