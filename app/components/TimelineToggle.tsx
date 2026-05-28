'use client';

interface TimelineToggleProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

const OPTION_LABELS: Record<string, string> = {
  '7D': '7D', '30D': '30D', '3M': '3M', '6M': '6M', '1Y': '1Y',
  '4W': '4W', '8W': '8W', '90D': '90D',
};

export default function TimelineToggle({ options, value, onChange, className = '' }: TimelineToggleProps) {
  return (
    <div
      className={`flex items-center gap-0.5 p-0.5 rounded-full ${className}`}
      style={{
        background: 'rgba(10,37,71,0.06)',
        border: '1px solid rgba(10,37,71,0.12)',
      }}
    >
      {options.map((opt) => {
        const isActive = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className="rounded-full transition-all duration-200 active:scale-95"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '5px 12px',
              color: isActive ? '#0c0d10' : 'rgba(10,37,71,0.52)',
              background: isActive ? 'rgba(255,255,255,0.92)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {OPTION_LABELS[opt] ?? opt}
          </button>
        );
      })}
    </div>
  );
}
