'use client'

import { useState } from 'react'

type BuilderStage = 'brief' | 'ideas' | 'scripts' | 'captions' | 'prompts' | 'generated'

interface CampaignBrief {
  goal: string
  product: string
  targetEmotion: string
  platform: string
  brandVoice: string
  ventureName: string
}

export default function CampaignStudioPage() {
  const [stage, setStage] = useState<BuilderStage>('brief')
  const [brief, setBrief] = useState<CampaignBrief>({
    goal: '', product: '', targetEmotion: '', platform: 'instagram', brandVoice: 'confident, innovative', ventureName: 'Novizio'
  })
  const [ideas, setIdeas] = useState<Record<string, unknown>[]>([])
  const [selectedIdea, setSelectedIdea] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null)

  const STEPS: { key: BuilderStage; label: string }[] = [
    { key: 'brief', label: '1. Brief' },
    { key: 'ideas', label: '2. Ideas' },
    { key: 'scripts', label: '3. Scripts' },
    { key: 'captions', label: '4. Captions' },
    { key: 'prompts', label: '5. Prompts' },
    { key: 'generated', label: '6. Assets' },
  ]

  const stageIndex = STEPS.findIndex((s) => s.key === stage)

  async function runStage(s: BuilderStage) {
    setLoading(true)
    setError('')
    setStage(s)

    try {
      const res = await fetch('/api/campaign-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: s === 'prompts' ? 'image_prompts' : s,
          brief,
          selectedIdea,
          script: (lastResult as Record<string, unknown>)?.scenes ? JSON.stringify((lastResult as Record<string, unknown>).scenes ?? '') : '',
        }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      if (s === 'ideas') {
        const parsed = JSON.parse(data.result as string ?? '[]') as Record<string, unknown>[]
        setIdeas(Array.isArray(parsed) ? parsed : [parsed])
      } else {
        setLastResult(data.result as Record<string, unknown> ?? {})
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Campaign Studio</h1>

      {/* Step Progress */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {STEPS.map((step, i) => (
          <div
            key={step.key}
            onClick={() => i <= stageIndex ? setStage(step.key) : undefined}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: i <= stageIndex ? 'rgba(0,200,83,0.1)' : 'var(--color-surface)',
              border: `1px solid ${i <= stageIndex ? 'var(--color-accent)' : 'var(--color-border)'}`,
              color: i <= stageIndex ? 'var(--color-accent)' : 'var(--color-muted)',
              fontSize: '12px',
              fontWeight: i <= stageIndex ? 700 : 400,
              cursor: i <= stageIndex ? 'pointer' : 'default',
            }}
          >
            {step.label}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(233,69,96,0.1)', border: '1px solid #E94560', color: '#E94560', marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Stage: Brief */}
      {stage === 'brief' && (
        <div style={{ maxWidth: '600px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Campaign Brief</h2>
          {[
            { key: 'goal', label: 'Campaign Goal', placeholder: 'e.g. Drive signups for the new product' },
            { key: 'product', label: 'Product/Service', placeholder: 'e.g. YVON BI Dashboard' },
            { key: 'targetEmotion', label: 'Target Emotion', placeholder: 'e.g. confidence, inspiration, urgency' },
            { key: 'brandVoice', label: 'Brand Voice', placeholder: 'e.g. confident, innovative, action-oriented' },
            { key: 'ventureName', label: 'Brand Name', placeholder: 'e.g. Novizio' },
          ].map((field) => (
            <div key={field.key} style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>{field.label}</label>
              <input
                value={brief[field.key as keyof CampaignBrief]}
                onChange={(e) => setBrief((b) => ({ ...b, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
          ))}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Platform</label>
            <select
              value={brief.platform}
              onChange={(e) => setBrief((b) => ({ ...b, platform: e.target.value }))}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: '13px', outline: 'none' }}
            >
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="twitter">Twitter/X</option>
            </select>
          </div>
          <button
            onClick={() => runStage('ideas')}
            disabled={loading || !brief.goal}
            style={{
              marginTop: '16px',
              padding: '10px 24px',
              borderRadius: '8px',
              border: '1px solid var(--color-accent)',
              background: 'rgba(0,200,83,0.15)',
              color: 'var(--color-accent)',
              fontWeight: 700,
              cursor: loading || !brief.goal ? 'default' : 'pointer',
              opacity: loading || !brief.goal ? 0.5 : 1,
            }}
          >
            {loading ? 'Generating ideas…' : 'Generate 5 Ideas →'}
          </button>
        </div>
      )}

      {/* Stage: Ideas */}
      {stage === 'ideas' && (
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Campaign Ideas ({ideas.length})</h2>
          {ideas.length === 0 && !loading && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-muted)' }}>No ideas generated yet. Back to Brief to submit.</div>
          )}
          {loading && <div style={{ padding: '20px', color: 'var(--color-muted)' }}>Generating ideas…</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {ideas.map((idea, i) => (
              <div
                key={i}
                onClick={() => setSelectedIdea(JSON.stringify(idea))}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  border: selectedIdea === JSON.stringify(idea) ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                  background: selectedIdea === JSON.stringify(idea) ? 'rgba(0,200,83,0.05)' : 'var(--color-surface)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{String(idea.title ?? `Idea ${i + 1}`)}</span>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: (String(idea.expectedImpact) === 'high' ? '#22C55E' : String(idea.expectedImpact) === 'medium' ? '#F59E0B' : '#6B7280') + '20', color: String(idea.expectedImpact) === 'high' ? '#22C55E' : String(idea.expectedImpact) === 'medium' ? '#F59E0B' : '#6B7280' }}>
                    {String(idea.expectedImpact)}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '4px' }}>Hook: {String(idea.hook)}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '4px' }}>Format: {String(idea.format)}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Angle: {String(idea.angle)}</div>
              </div>
            ))}
          </div>
          {ideas.length > 0 && (
            <button
              onClick={() => runStage('scripts')}
              disabled={loading || !selectedIdea}
              style={{
                marginTop: '16px',
                padding: '10px 24px',
                borderRadius: '8px',
                border: '1px solid var(--color-accent)',
                background: 'rgba(0,200,83,0.15)',
                color: 'var(--color-accent)',
                fontWeight: 700,
                cursor: loading || !selectedIdea ? 'default' : 'pointer',
                opacity: loading || !selectedIdea ? 0.5 : 1,
              }}
            >
              {loading ? 'Generating scripts…' : 'Generate Scripts →'}
            </button>
          )}
        </div>
      )}

      {/* Stage: Scripts/Captions/Prompts/Generated */}
      {(stage === 'scripts' || stage === 'captions' || stage === 'prompts' || stage === 'generated') && (
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            {stage === 'scripts' && 'Scripts'}
            {stage === 'captions' && 'Captions & Hashtags'}
            {stage === 'prompts' && 'Image Prompts'}
            {stage === 'generated' && 'Generated Assets'}
          </h2>
          {loading && <div style={{ padding: '20px', color: 'var(--color-muted)' }}>Generating…</div>}
          {lastResult ? (
            <pre style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
            }}>
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          ) : !loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-muted)' }}>No content generated yet. Go back to a previous step.</div>
          ) : null}
          {stage === 'scripts' && lastResult && (
            <button onClick={() => runStage('captions')} style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '8px', border: '1px solid var(--color-accent)', background: 'rgba(0,200,83,0.15)', color: 'var(--color-accent)', fontWeight: 700, cursor: 'pointer' }}>
              Generate Captions →
            </button>
          )}
          {stage === 'captions' && lastResult && (
            <button onClick={() => runStage('prompts')} style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '8px', border: '1px solid var(--color-accent)', background: 'rgba(0,200,83,0.15)', color: 'var(--color-accent)', fontWeight: 700, cursor: 'pointer' }}>
              Generate Image Prompts →
            </button>
          )}
          {stage === 'prompts' && lastResult && (
            <button onClick={() => setStage('generated')} style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '8px', border: '1px solid var(--color-accent)', background: 'rgba(0,200,83,0.15)', color: 'var(--color-accent)', fontWeight: 700, cursor: 'pointer' }}>
              Generate Assets (Krea AI) →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
