import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, StatusBadge, Chip, PageHeader } from '@/components/ui'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Hello World</Card>)
    expect(screen.getByText('Hello World')).toBeDefined()
  })

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>)
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain('custom-class')
  })

  it('renders with glass-card class', () => {
    const { container } = render(<Card>Content</Card>)
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain('glass-card')
  })

  it('adds glass-card-hover when hover prop is true', () => {
    const { container } = render(<Card hover>Content</Card>)
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain('glass-card-hover')
  })

  it('does not add glass-card-hover when hover is not set', () => {
    const { container } = render(<Card>Content</Card>)
    const div = container.firstChild as HTMLElement
    expect(div.className).not.toContain('glass-card-hover')
  })
})

describe('StatusBadge', () => {
  it('renders children text', () => {
    render(<StatusBadge tone="green">Active</StatusBadge>)
    expect(screen.getByText('Active')).toBeDefined()
  })

  const tones: Array<'yellow' | 'green' | 'blue' | 'red' | 'muted'> = [
    'yellow', 'green', 'blue', 'red', 'muted',
  ]

  for (const tone of tones) {
    it(`renders with tone "${tone}" without error`, () => {
      const { container } = render(<StatusBadge tone={tone}>{tone}</StatusBadge>)
      const span = container.firstChild as HTMLElement
      expect(span.tagName).toBe('SPAN')
      expect(span.className).toContain('rounded-full')
    })
  }
})

describe('Chip', () => {
  it('renders children text', () => {
    render(<Chip>Tag</Chip>)
    expect(screen.getByText('Tag')).toBeDefined()
  })

  it('renders with chip class', () => {
    const { container } = render(<Chip>Tag</Chip>)
    const span = container.firstChild as HTMLElement
    expect(span.className).toContain('chip')
  })

  it('applies accent class when accent prop is true', () => {
    const { container } = render(<Chip accent>Accent Tag</Chip>)
    const span = container.firstChild as HTMLElement
    expect(span.className).toContain('chip-accent')
  })

  it('applies custom className', () => {
    const { container } = render(<Chip className="extra">Tag</Chip>)
    const span = container.firstChild as HTMLElement
    expect(span.className).toContain('extra')
  })
})

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Dashboard" />)
    expect(screen.getByText('Dashboard')).toBeDefined()
  })

  it('renders subtitle when provided', () => {
    render(<PageHeader title="Dashboard" subtitle="Overview of your system" />)
    expect(screen.getByText('Overview of your system')).toBeDefined()
  })

  it('does not render subtitle element when not provided', () => {
    const { container } = render(<PageHeader title="Dashboard" />)
    // There should be no <p> tag for subtitle
    const pTags = container.querySelectorAll('p')
    // The subtitle would be a p tag; without subtitle there should be 0 p tags
    expect(pTags.length).toBe(0)
  })

  it('renders actions when provided', () => {
    render(
      <PageHeader
        title="Dashboard"
        actions={<button>Settings</button>}
      />
    )
    expect(screen.getByText('Settings')).toBeDefined()
  })

  it('uses h1 tag for title', () => {
    render(<PageHeader title="Dashboard" />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeDefined()
    expect(heading.textContent).toBe('Dashboard')
  })
})
