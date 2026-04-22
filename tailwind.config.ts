import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // v3.0 core tokens
        bg:      'var(--bg)',
        sf:      'var(--sf)',
        sf2:     'var(--sf2)',
        sf3:     'var(--sf3)',
        'sf-green-2': 'var(--sf-green-2)',
        b1:      'var(--b1)',
        b2:      'var(--b2)',
        b3:      'var(--b3)',
        mu:      'var(--mu)',
        mi:      'var(--mi)',
        di:      'var(--di)',
        tx:      'var(--tx)',
        br:      'var(--br)',
        // semantic colors (v2 — green accent primary)
        ac:      'var(--ac)',
        gn:      'var(--gn)',
        'gn-light': 'var(--gn-light)',
        'gn-dark':  'var(--gn-dark)',
        rd:      'var(--rd)',
        am:      'var(--am)',
        bl:      'var(--bl)',
        // new v2 named tokens
        accent:  'var(--color-accent)',
        'accent-bright': 'var(--color-accent-bright)',
        'accent-dim':    'var(--color-accent-dim)',
        'accent-bg': 'var(--color-accent-bg)',
        teal:  'var(--color-teal)',
        'teal-dim': 'var(--color-teal-dim)',
        'color-bg': 'var(--color-bg)',
        'color-surface': 'var(--color-surface)',
        'color-text': 'var(--color-text)',
        'color-muted': 'var(--color-muted)',
        'color-border': 'var(--color-border)',
        // heatmap
        'heat-0': 'var(--heat-0)',
        'heat-1': 'var(--heat-1)',
        'heat-2': 'var(--heat-2)',
        'heat-3': 'var(--heat-3)',
        'heat-4': 'var(--heat-4)',
        // legacy aliases
        navy:    'var(--color-navy)',
        red:     'var(--color-red)',
        blue:    'var(--color-blue)',
        surface: 'var(--color-surface)',
        muted:   'var(--color-muted)',
        text:    'var(--color-text)',
      },
      fontFamily: {
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-dm-mono)', 'Courier New', 'monospace'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      borderRadius: {
        sm:      '2px',
        DEFAULT: '2px',
        md:      '4px',
      },
      fontSize: {
        '10': '10px',
        '11': '11px',
        '12': '12px',
        '13': '13px',
      },
    },
  },
  plugins: [],
}

export default config
