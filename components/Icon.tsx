import { icons, type LucideProps } from 'lucide-react'

type Props = LucideProps & { name: string }

// Renders a lucide icon by its PascalCase name. Falls back to a dot.
export function Icon({ name, ...props }: Props) {
  const Cmp = icons[name as keyof typeof icons] ?? icons.Circle
  return <Cmp {...props} />
}
