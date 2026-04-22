'use client'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

type WorkloadLevel = 'low' | 'medium' | 'high' | 'full'

const LEVEL_COLORS: Record<WorkloadLevel, string> = {
  low: 'rgba(34, 197, 94, 0.12)',
  medium: 'rgba(34, 197, 94, 0.3)',
  high: 'rgba(34, 197, 94, 0.6)',
  full: 'rgba(34, 197, 94, 1)',
}

interface DayWorkload {
  day: string
  values: { label: string; level: WorkloadLevel }[]
}

interface HeatmapProps {
  onViewAll?: () => void
}

// Sample data — replace with API data later
const SAMPLE_DATA: DayWorkload[] = [
  { day: 'FEB', values: [{ label: '18', level: 'low' }, { label: '19', level: 'low' }, { label: '20', level: 'low' }, { label: '21', level: 'low' }, { label: '22', level: 'low' }, { label: '23', level: 'low' }, { label: '24', level: 'medium' }, { label: '25', level: 'medium' }, { label: '26', level: 'low' }, { label: '27', level: 'low' }, { label: '28', level: 'low' }, { label: '29', level: 'low' }] },
  { day: 'FRI', values: [{ label: '18', level: 'high' }, { label: '19', level: 'high' }, { label: '20', level: 'medium' }, { label: '21', level: 'medium' }, { label: '22', level: 'high' }, { label: '23', level: 'high' }, { label: '24', level: 'high' }, { label: '25', level: 'high' }, { label: '26', level: 'medium' }, { label: '27', level: 'low' }, { label: '28', level: 'low' }, { label: '29', level: 'low' }] },
  { day: 'SAT', values: [{ label: '18', level: 'low' }, { label: '19', level: 'low' }, { label: '20', level: 'low' }, { label: '21', level: 'low' }, { label: '22', level: 'medium' }, { label: '23', level: 'medium' }, { label: '24', level: 'high' }, { label: '25', level: 'high' }, { label: '26', level: 'medium' }, { label: '27', level: 'low' }, { label: '28', level: 'low' }, { label: '29', level: 'low' }] },
  { day: 'SUN', values: [{ label: '18', level: 'low' }, { label: '19', level: 'low' }, { label: '20', level: 'low' }, { label: '21', level: 'low' }, { label: '22', level: 'low' }, { label: '23', level: 'low' }, { label: '24', level: 'low' }, { label: '25', level: 'medium' }, { label: '26', level: 'medium' }, { label: '27', level: 'low' }, { label: '28', level: 'low' }, { label: '29', level: 'low' }] },
  { day: 'MON', values: [{ label: '18', level: 'medium' }, { label: '19', level: 'high' }, { label: '20', level: 'high' }, { label: '21', level: 'high' }, { label: '22', level: 'high' }, { label: '23', level: 'full' }, { label: '24', level: 'high' }, { label: '25', level: 'high' }, { label: '26', level: 'medium' }, { label: '27', level: 'medium' }, { label: '28', level: 'low' }, { label: '29', level: 'low' }] },
  { day: 'TUE', values: [{ label: '18', level: 'low' }, { label: '19', level: 'high' }, { label: '20', level: 'high' }, { label: '21', level: 'full' }, { label: '22', level: 'full' }, { label: '23', level: 'full' }, { label: '24', level: 'high' }, { label: '25', level: 'medium' }, { label: '26', level: 'medium' }, { label: '27', level: 'low' }, { label: '28', level: 'low' }, { label: '29', level: 'low' }] },
  { day: 'WED', values: [{ label: '18', level: 'medium' }, { label: '19', level: 'medium' }, { label: '20', level: 'high' }, { label: '21', level: 'high' }, { label: '22', level: 'full' }, { label: '23', level: 'full' }, { label: '24', level: 'high' }, { label: '25', level: 'high' }, { label: '26', level: 'medium' }, { label: '27', level: 'low' }, { label: '28', level: 'low' }, { label: '29', level: 'low' }] },
]

export default function Heatmap({ onViewAll }: HeatmapProps) {
  return (
    <div style={{ background: 'var(--sf)', border: '1px solid var(--b1)', borderRadius: '16px', padding: '18px 22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'var(--sf3)', border: '1px solid var(--b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
          }}>
            ▦
          </div>
          <span style={{ fontFamily: 'var(--font-outfit)', fontSize: '13px', fontWeight: 600, color: 'var(--br)' }}>
            Weekly Workload
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onViewAll}
            style={{
              fontFamily: 'var(--font-outfit)', fontSize: '10px', fontWeight: 500,
              color: 'var(--di)', background: 'var(--sf3)',
              border: '1px solid var(--b2)', borderRadius: '20px', padding: '3px 12px', cursor: 'pointer',
            }}
          >
            View all
          </button>
          <span style={{ fontSize: '14px', color: 'var(--mu)', cursor: 'pointer' }}>↻</span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '12px', paddingLeft: '42px' }}>
        {(['low', 'medium', 'high', 'full'] as WorkloadLevel[]).map(lvl => (
          <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: LEVEL_COLORS[lvl] }} />
            <span style={{ fontFamily: 'var(--font-outfit)', fontSize: '9px', fontWeight: 500, color: 'var(--di)', textTransform: 'capitalize' }}>
              {lvl === 'full' ? 'Fully Occupied' : lvl}
            </span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div>
        {/* Column labels */}
        <div style={{ display: 'flex', marginLeft: '42px', marginBottom: '4px' }}>
          {SAMPLE_DATA[0]?.values.map(v => (
            <div key={v.label} style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-outfit)', fontSize: '9px', fontWeight: 500, color: 'var(--mu)' }}>
              {v.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        {DAYS.map((day, di) => (
          <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: di < DAYS.length - 1 ? '3px' : 0 }}>
            <span style={{
              width: '36px', fontFamily: 'var(--font-outfit)', fontSize: '9px', fontWeight: 500,
              color: 'var(--di)', flexShrink: 0,
            }}>
              {day}
            </span>
            <div style={{ flex: 1, display: 'flex', gap: '3px' }}>
              {SAMPLE_DATA[di]?.values.map((v, vi) => (
                <div
                  key={vi}
                  title={`${day} ${v.label} — ${v.level}`}
                  style={{
                    flex: 1,
                    aspectRatio: '1',
                    borderRadius: '4px',
                    background: LEVEL_COLORS[v.level],
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
