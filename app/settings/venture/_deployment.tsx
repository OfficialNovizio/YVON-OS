'use client'

import { Card } from '@/components/ui'
import { Check, Save } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
//  CONSTANTS — Deployment platforms
// ═══════════════════════════════════════════════════════════════════════════
const DEPLOYMENT_PLATFORMS: { id: string; label: string; desc: string; icon: string; category: string;
  hint: { credentials: string; where: string; extracts: string; setupTime: string; } }[] = [
  { id: 'vercel', label: 'Vercel', desc: 'Frontend hosting & serverless', icon: '▲', category: 'hosting',
    hint: { credentials: 'Personal Access Token', where: 'Vercel Dashboard → Settings → Tokens → Create Token (Full Account scope)', extracts: 'Deployments, domains, env vars, project settings, build logs, traffic stats', setupTime: '2 min' } },
  { id: 'aws', label: 'AWS', desc: 'Cloud infrastructure', icon: '☁️', category: 'hosting',
    hint: { credentials: 'IAM Access Key + Secret Key', where: 'AWS Console → IAM → Users → Security Credentials → Create Access Key', extracts: 'EC2 instances, S3 buckets, Lambda functions, CloudFront, billing, RDS databases', setupTime: '5 min' } },
  { id: 'railway', label: 'Railway', desc: 'Full-stack platform', icon: '🚂', category: 'hosting',
    hint: { credentials: 'API Token', where: 'Railway Dashboard → Settings → Tokens → New Token', extracts: 'Services, deployments, variables, usage metrics, logs', setupTime: '1 min' } },
  { id: 'netlify', label: 'Netlify', desc: 'Jamstack hosting', icon: '🔺', category: 'hosting',
    hint: { credentials: 'Personal Access Token', where: 'Netlify → User Settings → Applications → Personal Access Tokens', extracts: 'Sites, deploys, forms, functions, split tests, analytics', setupTime: '2 min' } },
  { id: 'cloudflare', label: 'Cloudflare', desc: 'Edge & CDN', icon: '🌐', category: 'hosting',
    hint: { credentials: 'API Token (Zone:DNS:Edit + Zone:Read)', where: 'Cloudflare Dashboard → My Profile → API Tokens → Create Token', extracts: 'DNS records, Workers, Pages, WAF rules, analytics, caching', setupTime: '3 min' } },
  { id: 'website', label: 'Website', desc: 'Custom domain hosting', icon: '🌍', category: 'hosting',
    hint: { credentials: 'Domain / URL only', where: 'No auth needed — just the website URL', extracts: 'Uptime monitoring, SSL expiry, page speed, SEO score', setupTime: 'Instant' } },
  { id: 'supabase', label: 'Supabase', desc: 'Database, auth, storage', icon: '⚡', category: 'data',
    hint: { credentials: 'Service Role Key + Project Ref', where: 'Supabase Dashboard → Project Settings → API → service_role key', extracts: 'Tables, rows, auth users, storage buckets, edge functions, realtime', setupTime: '1 min' } },
  { id: 'firebase', label: 'Firebase', desc: 'Google backend platform', icon: '🔥', category: 'data',
    hint: { credentials: 'Service Account JSON', where: 'Firebase Console → Project Settings → Service Accounts → Generate New Private Key', extracts: 'Firestore, auth users, hosting, functions, FCM, remote config', setupTime: '2 min' } },
  { id: 'ga4', label: 'Google Analytics', desc: 'Traffic & conversion', icon: '📊', category: 'analytics',
    hint: { credentials: 'Measurement ID + API Secret', where: 'GA4 Admin → Data Streams → Web → Measurement ID, then Admin → Data Streams → Measurement Protocol API secrets', extracts: 'Page views, events, conversions, user metrics, realtime reports', setupTime: '3 min' } },
  { id: 'crashlytics', label: 'Crashlytics', desc: 'App crash reporting', icon: '🐛', category: 'analytics',
    hint: { credentials: 'Google Services JSON', where: 'Firebase Console → Project Settings → Your App → google-services.json', extracts: 'Crash reports, stack traces, issue trends, stability metrics', setupTime: '2 min' } },
  { id: 'appstore', label: 'App Store', desc: 'iOS distribution', icon: '🍎', category: 'apps',
    hint: { credentials: 'API Key (Issuer ID + Key ID + .p8)', where: 'App Store Connect → Users & Access → Keys → Generate API Key', extracts: 'App metadata, review status, sales, ratings, downloads', setupTime: '5 min' } },
  { id: 'playstore', label: 'Play Store', desc: 'Android distribution', icon: '🤖', category: 'apps',
    hint: { credentials: 'Service Account JSON', where: 'Google Cloud Console → Service Accounts → Create Key (JSON)', extracts: 'Reviews, ratings, installs, crashes, revenue, listings', setupTime: '3 min' } },
  { id: 'custom', label: 'Custom / Other', desc: 'Any other platform', icon: '🔧', category: 'other',
    hint: { credentials: 'API Key / URL / Token', where: 'Depends on the platform', extracts: 'Configurable', setupTime: 'Varies' } },
]

// ═══════════════════════════════════════════════════════════════════════════
//  PROPS
// ═══════════════════════════════════════════════════════════════════════════
interface DeploymentTabProps {
  deploymentPlatforms: string[]
  toggleDeployment: (platformId: string) => void
  websiteUrl: string; setWebsiteUrl: (v: string) => void
  saveAll: () => void
  saving: boolean
  saveMsg: string
}

// ═══════════════════════════════════════════════════════════════════════════
//  DEPLOYMENT TAB
// ═══════════════════════════════════════════════════════════════════════════
export default function DeploymentTab({
  deploymentPlatforms, toggleDeployment,
  websiteUrl, setWebsiteUrl,
  saveAll, saving, saveMsg,
}: DeploymentTabProps) {
  return (
    <div className="space-y-4">
      {/* Connected platforms grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {DEPLOYMENT_PLATFORMS.map(dp => {
          const connected = deploymentPlatforms.includes(dp.id)
          return (
            <div key={dp.id}
              className={`glass-card p-3 cursor-pointer transition ${connected ? 'border-current' : 'hover:bg-white/[0.02]'}`}
              style={connected ? { borderColor: 'var(--ws-accent)' } : {}}
              onClick={() => toggleDeployment(dp.id)}>
              <div className="flex items-start gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                  connected ? 'bg-white/[0.08]' : 'bg-white/[0.02]'
                }`}
                style={connected ? { color: 'var(--ws-accent)' } : {}}>
                  {dp.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-on-surface">{dp.label}</p>
                    {connected ? <Check size={14} style={{ color: 'var(--ws-accent)' }} /> : <span className="text-[10px] text-on-surface-variant/30">Connect</span>}
                  </div>
                  <p className="text-[11px] text-on-surface-variant/40 mt-0.5">{dp.desc}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Connected platform details — one hint card per platform */}
      {deploymentPlatforms.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {deploymentPlatforms.map(pid => {
            const dp = DEPLOYMENT_PLATFORMS.find(p => p.id === pid)
            if (!dp) return null
            return (
              <Card key={dp.id} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{dp.icon}</span>
                  <h3 className="text-sm font-semibold text-on-surface">{dp.label}</h3>
                  <span className="ml-auto text-[10px] text-on-surface-variant/40">{dp.category}</span>
                </div>

                {/* Hint section */}
                <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3 mb-3 space-y-2 text-xs">
                  <div className="flex gap-2">
                    <span className="text-on-surface-variant/40 shrink-0">🔑</span>
                    <div>
                      <span className="text-on-surface-variant/60">Credentials needed: </span>
                      <span className="text-on-surface font-medium">{dp.hint.credentials}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-on-surface-variant/40 shrink-0">📍</span>
                    <div>
                      <span className="text-on-surface-variant/60">Where to get them: </span>
                      <span className="text-on-surface">{dp.hint.where}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-on-surface-variant/40 shrink-0">📊</span>
                    <div>
                      <span className="text-on-surface-variant/60">YVON can extract: </span>
                      <span className="text-on-surface">{dp.hint.extracts}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-on-surface-variant/40 shrink-0">⚡</span>
                    <div>
                      <span className="text-on-surface-variant/60">Setup time: </span>
                      <span className="text-emerald-400">{dp.hint.setupTime}</span>
                    </div>
                  </div>
                </div>

                {/* Credential input — platform-specific */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pid === 'vercel' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Vercel Token</label>
                        <input type="password" placeholder="vercel_xxxxxxxx" className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Team / Project ID</label>
                        <input placeholder="team_xxx or prj_xxx" className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                      </div>
                    </>
                  )}
                  {pid === 'aws' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">AWS Access Key ID</label>
                        <input placeholder="AKIA..." className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">AWS Secret Access Key</label>
                        <input type="password" placeholder="••••••••" className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">AWS Region</label>
                        <input placeholder="us-east-1" className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                      </div>
                    </>
                  )}
                  {pid === 'railway' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Railway API Token</label>
                      <input type="password" placeholder="railway_..." className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                    </div>
                  )}
                  {pid === 'netlify' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Netlify Personal Access Token</label>
                      <input type="password" placeholder="nfp_..." className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                    </div>
                  )}
                  {pid === 'cloudflare' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Cloudflare API Token</label>
                        <input type="password" placeholder="••••••••" className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Zone ID</label>
                        <input placeholder="abc123..." className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                      </div>
                    </>
                  )}
                  {pid === 'website' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Website URL</label>
                      <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://yoursite.com" className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-white/20" />
                    </div>
                  )}
                  {pid === 'supabase' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Supabase URL</label>
                        <input placeholder="https://xxx.supabase.co" className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Service Role Key</label>
                        <input type="password" placeholder="ey..." className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                      </div>
                    </>
                  )}
                  {pid === 'firebase' && (
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Firebase Service Account JSON</label>
                      <textarea rows={4} placeholder='{"type": "service_account", "project_id": "..."}' className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20 resize-none font-mono text-xs" />
                    </div>
                  )}
                  {pid === 'ga4' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Measurement ID</label>
                        <input placeholder="G-XXXXXXXXXX" className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">API Secret</label>
                        <input type="password" placeholder="••••••••" className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                      </div>
                    </>
                  )}
                  {pid === 'crashlytics' && (
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Google Services JSON</label>
                      <textarea rows={3} placeholder='{"project_info": {...}}' className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20 resize-none font-mono text-xs" />
                    </div>
                  )}
                  {pid === 'appstore' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Issuer ID</label>
                        <input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Key ID</label>
                        <input placeholder="XXXXXXXXXX" className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Private Key (.p8 content)</label>
                        <textarea rows={3} placeholder="-----BEGIN PRIVATE KEY-----" className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20 resize-none font-mono text-xs" />
                      </div>
                    </>
                  )}
                  {pid === 'playstore' && (
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Google Play Service Account JSON</label>
                      <textarea rows={4} placeholder='{"type": "service_account", ...}' className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20 resize-none font-mono text-xs" />
                    </div>
                  )}
                  {pid === 'custom' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Platform Name</label>
                        <input placeholder="e.g. Heroku" className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">API Key / Token</label>
                        <input type="password" placeholder="••••••••" className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="text-[11px] text-on-surface-variant/60 uppercase tracking-wider">Endpoint URL / Notes</label>
                        <input placeholder="https://api.example.com" className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-white/20" />
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-3 pb-4">
        <button onClick={saveAll} disabled={saving}
          className="btn-accent flex items-center gap-1.5 text-xs px-4 py-2">
          <Save size={14} /> {saving ? 'Saving...' : 'Save Deployment'}
        </button>
        {saveMsg && <span className={`text-xs ${saveMsg.startsWith('Saved') ? 'text-emerald-400' : 'text-red-400'}`}>{saveMsg}</span>}
      </div>
    </div>
  )
}
