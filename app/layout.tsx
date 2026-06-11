import type { Metadata } from 'next'
import './globals.css'
import { WorkspaceProvider } from '@/lib/WorkspaceContext'
import { Shell } from '@/components/Shell'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'YVON OS · Mission Control',
  description: 'AI agent command center — LifeOS screens on the YVON design system.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-on-surface bg-yvon-image min-h-screen">
        <WorkspaceProvider>
          <ErrorBoundary>
            <Shell>{children}</Shell>
          </ErrorBoundary>
        </WorkspaceProvider>
      </body>
    </html>
  )
}
